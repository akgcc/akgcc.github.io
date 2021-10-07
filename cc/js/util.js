function thumbnail_tooltip(chart_canvas) {
	return function f(tooltip) {
		var tooltipEl = document.getElementById('chartjs-tooltip')
		
		if (!tooltip.title) {
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
		tooltipEl.style.fontFamily = tooltip._bodyFontFamily
		tooltipEl.style.fontSize = tooltip.bodyFontSize
		tooltipEl.style.fontStyle = tooltip._bodyFontStyle
		
		
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