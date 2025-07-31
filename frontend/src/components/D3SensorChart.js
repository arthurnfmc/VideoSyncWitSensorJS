import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Select from 'react-select';

const D3SensorChart = ({ data, preSelectedFeatures = [], onSelectTime }) => {
  const svgRef = useRef();
  const [selectedFeatures, setSelectedFeatures] = useState(preSelectedFeatures);

  const allFeatures = Object.keys(data[0]).filter(key => key !== 'seconds_passed' && key !== 'time');

  useEffect(() => {
    if (!selectedFeatures.length) return;

    const legendWidth = 150;
    const width = 950 - legendWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + legendWidth)
      .attr('height', height);

    const xExtent = d3.extent(data, d => d.seconds_passed);
    const totalDuration = xExtent[1] - xExtent[0];
    const minZoomWidth = 15;
    const maxScale = totalDuration / minZoomWidth;

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([margin.left, width - margin.right]);
    const xScaleOriginal = xScale.copy();

    const yMin = d3.min(selectedFeatures, feature => d3.min(data, d => d[feature]));
    const yMax = d3.max(selectedFeatures, feature => d3.max(data, d => d[feature]));
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    const xAxisG = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);

    // === clipPath para restringir a área visível ===
    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    const lineGroup = svg.append('g')
      .attr('class', 'lines')
      .attr('clip-path', 'url(#clip)');

    const drawLines = () => {
      lineGroup.selectAll('path').remove();
      selectedFeatures.forEach((feature, index) => {
        const lineGenerator = d3.line()
          .x(d => xScale(d.seconds_passed))
          .y(d => yScale(d[feature]));

        lineGroup.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', d3.schemeCategory10[index % 10])
          .attr('stroke-width', 2)
          .attr('d', lineGenerator);
      });
    };

    drawLines();

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 10}, ${margin.top})`);

    selectedFeatures.forEach((feature, index) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${index * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d3.schemeCategory10[index % 10]);

      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .text(feature)
        .attr('font-size', '12px')
        .attr('fill', '#000');
    });

    // === Linha vertical interativa ===
    const verticalLine = svg.append('line')
      .attr('stroke', 'red')
      .attr('stroke-width', 1)
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .style('display', 'none')
      .attr('clip-path', 'url(#clip)'); // restringe a linha também

    const overlay = svg.append('rect')
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('x', margin.left)
      .attr('y', margin.top)
      .style('fill', 'transparent')
      .style('pointer-events', 'all');

    overlay
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const clampedX = Math.max(margin.left, Math.min(mouseX, width - margin.right));
        verticalLine
          .attr('x1', clampedX)
          .attr('x2', clampedX)
          .style('display', null);
      })
      .on('mouseout', () => {
        verticalLine.style('display', 'none');
      })
      .on('click', function (event) {
        const [mouseX] = d3.pointer(event);
        const clampedX = Math.max(margin.left, Math.min(mouseX, width - margin.right));
        const time = xScale.invert(clampedX);
        if (onSelectTime) {
          const roundedTime = Math.round(time * 100) / 100;
          onSelectTime(roundedTime);
        }
      });

    // === Zoom com limites e restrição de deslocamento ===
    const zoom = d3.zoom()
      .scaleExtent([1, maxScale])
      .translateExtent([[margin.left, 0], [width - margin.right, height]])
      .extent([[margin.left, 0], [width - margin.right, height]])
      .on('zoom', (event) => {
        const t = event.transform;
        xScale.domain(t.rescaleX(xScaleOriginal).domain());

        // Limita o domínio para o intervalo dos dados
        const domain = xScale.domain();
        const newStart = Math.max(xExtent[0], domain[0]);
        const newEnd = Math.min(xExtent[1], domain[1]);
        xScale.domain([newStart, newEnd]);

        xAxisG.call(xAxis);
        drawLines();
      });

    svg.call(zoom);

  }, [data, selectedFeatures, onSelectTime]);

  const featureOptions = allFeatures.map(f => ({ value: f, label: f }));

  const handleSelectChange = selected => {
    setSelectedFeatures(selected.map(opt => opt.value));
  };

  return (
    <div>
      <h3>Selecione as features</h3>
      <Select
        isMulti
        options={featureOptions}
        onChange={handleSelectChange}
        placeholder="Selecione as features..."
      />
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default D3SensorChart;
