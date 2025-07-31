import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Select from 'react-select';
import './D3SensorLineChart.css';

const D3SensorLineChart = ({ data, preSelectedFeatures = [], videoRef, videoStartTime = 0 }) => {
  const svgRef = useRef();
  const xScaleRef = useRef();
  const xDomainRef = useRef([0, 15]);

  const [selectedFeatures, setSelectedFeatures] = useState(preSelectedFeatures);
  const [xDomain, setXDomain] = useState([0, 15]);
  const [isUserDragging, setIsUserDragging] = useState(false);

  const allFeatures = Object.keys(data[0]).filter(key => key !== 'seconds_passed' && key !== 'time');

  // Mantém xDomainRef sincronizado com o estado real
  useEffect(() => {
    xDomainRef.current = xDomain;
  }, [xDomain]);

  useEffect(() => {
    if (!selectedFeatures.length) return;

    const legendWidth = 150;
    const width = 950 - legendWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };

    // Limpa SVG
    d3.select(svgRef.current).selectAll('*').remove();

    // Cria SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width + legendWidth)
      .attr('height', height);

    // Escalas
    const xScale = d3
      .scaleLinear()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

    xScaleRef.current = xScale;

    const yMin = d3.min(selectedFeatures, feature => d3.min(data, d => d[feature]));
    const yMax = d3.max(selectedFeatures, feature => d3.max(data, d => d[feature]));
    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.bottom, margin.top]);

    // Eixos
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);

    // Desenha as linhas (somente dados visíveis)
    selectedFeatures.forEach((feature, index) => {
      const lineGenerator = d3
        .line()
        .x(d => xScale(d.seconds_passed))
        .y(d => yScale(d[feature]));

      const filteredData = data.filter(d => d.seconds_passed >= xDomain[0] && d.seconds_passed <= xDomain[1]);

      svg
        .append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', d3.schemeCategory10[index % 10])
        .attr('stroke-width', 2)
        .attr('d', lineGenerator);
    });

    // Legenda
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

    // Linha vermelha vertical
    svg.append('line')
      .attr('class', 'cursor-line')
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('x1', xScale(0))
      .attr('x2', xScale(0));

    // Drag horizontal
    const drag = d3.drag()
      .on('start', () => setIsUserDragging(true))
      .on('drag', (event) => {
        const domain = xDomainRef.current;
        const secondsPerPixel = (domain[1] - domain[0]) / (width - margin.left - margin.right);
        const shiftSeconds = -event.dx * secondsPerPixel;

        let newStart = Math.max(0, domain[0] + shiftSeconds);
        let newEnd = newStart + 15;

        const maxTime = d3.max(data, d => d.seconds_passed);
        if (newEnd > maxTime) {
          newEnd = maxTime;
          newStart = newEnd - 15;
          if (newStart < 0) newStart = 0;
        }

        setXDomain([newStart, newEnd]);
      })
      .on('end', () => setIsUserDragging(false));

    svg.call(drag);

  }, [data, selectedFeatures, xDomain]);

  // Atualiza linha do cursor conforme o tempo do vídeo
  useEffect(() => {
    if (!videoRef?.current || !xScaleRef.current) return;

    const svg = d3.select(svgRef.current);
    let animationId;

    const updateLine = () => {
      const currentTime = videoRef.current.currentTime - videoStartTime;

      if (!isUserDragging) {
        const newStart = Math.max(0, currentTime - 15);
        const newEnd = newStart + 15;
        setXDomain([newStart, newEnd]);
      }

      const x = xScaleRef.current(currentTime);
      svg.select('.cursor-line')
        .attr('x1', x)
        .attr('x2', x);

      animationId = requestAnimationFrame(updateLine);
    };

    animationId = requestAnimationFrame(updateLine);

    return () => cancelAnimationFrame(animationId);
  }, [videoRef, selectedFeatures, videoStartTime, isUserDragging]);

  const featureOptions = allFeatures.map(f => ({ value: f, label: f }));

  const handleSelectChange = selected => {
    setSelectedFeatures(selected.map(opt => opt.value));
  };

  return (
    <div className='flex-wrapper-graphic'>
      <Select
        className="feature-select"
        classNamePrefix="select"
        isMulti
        options={featureOptions}
        onChange={handleSelectChange}
        placeholder="Selecione as features..."
        defaultValue={preSelectedFeatures.map(f => ({ value: f, label: f }))}
      />
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default D3SensorLineChart;
