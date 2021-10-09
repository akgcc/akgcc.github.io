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
var percentColors; // define this according to your data.

var getColorForPercentage = function(pct) {
    for (var i = 1; i < percentColors.length - 1; i++) {
        if (pct < percentColors[i].pct) {
            break;
        }
    }
    var lower = percentColors[i - 1];
    var upper = percentColors[i];
    var range = upper.pct - lower.pct;
    var rangePct = (pct - lower.pct) / range;
    var pctLower = 1 - rangePct;
    var pctUpper = rangePct;
    var color = {
        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper),
		a: (lower.color.a * pctLower + upper.color.a * pctUpper).toFixed(2)
    };
    return 'rgba(' + [color.r, color.g, color.b, color.a].join(',') + ')';
};

// Modify chartjs pointElement to draw a circular image instead.
const drawPoint_round = (ctx, options, x, y) => {
	let type, xOffset, yOffset, size, cornerRadius;
	const style = options.pointStyle;
	const rotation = options.rotation;
	const radius = options.radius;
	let rad = (rotation || 0) * Chart.helpers.RAD_PER_DEG;

	if (style && typeof style === 'object') {
		type = style.toString();
		if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rad);
			
			// below block is modified code.
			ctx.beginPath()
			ctx.arc(0, 0, style.height/2, 0, 2*Math.PI, false);
			ctx.strokeStyle = '#999'
			ctx.stroke()
			ctx.clip()
			ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
			///////////////////////////////
			
			ctx.restore();
			return;
		}
	}

	return Chart.helpers.drawPoint(ctx, options, x, y)
}
const pe_draw_orig = Chart.PointElement.prototype.draw
Chart.PointElement.prototype.draw = function(ctx, area) {
	const options = this.options;

    if (this.skip || options.radius < 0.1 || !Chart.helpers._isPointInArea(this, area, this.size(options) / 2)) {
      return;
    }

    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.fillStyle = options.backgroundColor;
	
	drawPoint_round(ctx, options, this.x, this.y); // only this line was modified
}
