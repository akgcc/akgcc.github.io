function thumbnail_tooltip(chart_canvas) {
	// This function is not perfect, it will only work at this exact tooltip height due to the image adding width
	// to compensate for this extra width, you must set xPadding in your chart's tooltip options to 6+h/2 where h is the computed height of the tooltip - 6. (6 is for the 3px padding defined in the css)
	return function f(context) {
		let tooltip = context.tooltip
		var tooltipEl = document.getElementById('chartjs-tooltip')
		if (tooltip.opacity == 0) {
			tooltipEl.classList.add('hidden')
			return
		}
		tooltipEl.className = '' // clear all classes
		let beforeRect = tooltipEl.getBoundingClientRect()
		tooltipEl.style.cssText = ''
		tooltipEl.classList.add('x' + tooltip.xAlign)
		tooltipEl.classList.add('y' + tooltip.yAlign)
		var innerHtml = ''
		innerHtml = '<img src="https://aceship.github.io/AN-EN-Tags/img/avatars/' + charIdMap[tooltip.title[0]] + '.png"> <div> <span><b>' + tooltip.title[0] + '</b></span>';
		for (const [i, b] of tooltip.body.entries()) {
			innerHtml += '<span><i class="fas fa-square-full" style="color: ' + tooltip.labelColors[i].backgroundColor + '; font-size:' + (parseInt(tooltip.bodyFontSize) - 2) + '"></i>' + b.lines[0] + '</span>'
		}
		innerHtml += '</div>'
		tooltipEl.innerHTML = innerHtml
		tooltipEl.style.left = chart_canvas.offsetLeft + tooltip.x + 'px'
		tooltipEl.style.top = chart_canvas.offsetTop + tooltip.y + 'px'
		tooltipEl.style.height = tooltip.height - 6 + 'px' // -3px padding
		tooltipEl.style.font = Chart.helpers.toFont(tooltip.options.bodyFont).string;
		
		// animate movement with FLIP technique
		let newRect = tooltipEl.getBoundingClientRect();
		let xform = 'translateY(' + (beforeRect.top - newRect.top) + 'px) translateX(' + (beforeRect.left - newRect.left) + 'px)'
		tooltipEl.style.transition = 'opacity .25s ease, transform 0s'
		tooltipEl.style.transform = xform
		window.requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			tooltipEl.style.removeProperty('transform')
			tooltipEl.style.removeProperty('transition')
		});
	})
	}
}