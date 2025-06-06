import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Select from 'react-select';

const D3SensorLineChart = ({ data, preSelectedFeatures = [], videoRef, videoStartTime = 0}) => {
  const svgRef = useRef();
  const xScaleRef = useRef(); // Ref para guardar xScale
  const [selectedFeatures, setSelectedFeatures] = useState(preSelectedFeatures);

  const allFeatures = Object.keys(data[0]).filter(key => key !== 'seconds_passed');

  useEffect(() => {
    if (!selectedFeatures.length) return;

    // Tamanho e margens
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
      .domain(d3.extent(data, d => d.seconds_passed))
      .range([margin.left, width - margin.right]);

    xScaleRef.current = xScale; // Salva para uso no outro useEffect

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

    // Desenha as linhas
    selectedFeatures.forEach((feature, index) => {
      const lineGenerator = d3
        .line()
        .x(d => xScale(d.seconds_passed))
        .y(d => yScale(d[feature]));

      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', d3.schemeCategory10[index % 10])
        .attr('stroke-width', 2)
        .attr('d', lineGenerator);
    });

    // Criar grupo de legenda
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

    // Linha vertical (cursor)
    svg.append('line')
      .attr('class', 'cursor-line')
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('x1', xScale(0))
      .attr('x2', xScale(0));

  }, [data, selectedFeatures]);

  // Atualiza a posição da linha vertical com base no tempo do vídeo
  useEffect(() => {
    if (!videoRef?.current || !xScaleRef.current) return;

    let animationId;
    const svg = d3.select(svgRef.current);

    const updateLine = () => {
      const currentTime = videoRef.current.currentTime - videoStartTime;
      const x = xScaleRef.current(currentTime);

      svg.select('.cursor-line')
        .attr('x1', x)
        .attr('x2', x);

      animationId = requestAnimationFrame(updateLine);
    };

    animationId = requestAnimationFrame(updateLine);

    return () => cancelAnimationFrame(animationId);
  }, [videoRef, selectedFeatures]); // dispara sempre que mudar o vídeo ou as features

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
        defaultValue={preSelectedFeatures.map(f => ({ value: f, label: f }))}
      />

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default D3SensorLineChart;
