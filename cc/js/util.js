const CLASS_MAPPING = {WARRIOR: 'Guard', SUPPORT: 'Supporter', CASTER: 'Caster', SNIPER: 'Sniper', TANK: 'Defender', PIONEER: 'Vanguard', SPECIAL: 'Specialist', MEDIC: 'Medic'}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
	return array;
}

function updateJSON(dest, src) {
	for (let key in dest) {
	  if(src.hasOwnProperty(key)){
		if (typeof dest[key] == 'object')
			dest[key] = updateJSON(dest[key], src[key])
		else
			dest[key] = src[key];
	  }
	}
	return dest
}

//add tooltip element for use in below functions
let tt = document.createElement('div')
tt.id = 'chartjs-tooltip'
tt.classList.add('hidden')
document.addEventListener("DOMContentLoaded",() => document.body.appendChild(tt))

async function get_char_table() {
	let raw = await fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json')
	let json = await raw.json()
	// add amiya alts
	json['char_1001_amiya2'] = JSON.parse(JSON.stringify(json['char_002_amiya']))
	json['char_1001_amiya2'].name = 'Guardmiya'
	json['char_1001_amiya2'].profession = json['char_350_surtr'].profession
	json['char_1001_amiya2'].skills = json['char_1001_amiya2'].skills.slice(0,2)
	json['char_1001_amiya2'].skills[0].skillId = 'skchr_amiya2_1'
    json['char_1001_amiya2'].skills[1].skillId = 'skchr_amiya2_2'
	
	Object.keys(json).forEach(op => {
		json[op].profession = CLASS_MAPPING[json[op].profession] || json[op].profession
	})
	return json
}

function thumbnail_tooltip(chart_canvas) {
	// This function is not perfect, it will only work at this exact tooltip height due to the image adding width
	// to compensate for this extra width, you must set xPadding in your chart's tooltip options to 6+h/2 where h is the computed height of the tooltip - 6. (6 is for the 3px padding defined in the css)
	// This is done automatically by adding the tt_size_plugin() callback (below) to tooltip.plugins.afterLabel
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
		let title = tooltip.title[0] || tooltip.body[0].lines[0].split(':')[0] // for pie chart legend
		innerHtml = '<img src="https://aceship.github.io/AN-EN-Tags/img/avatars/' + charIdMap[title] + '.png"> <div> <span><b>' + title + '</b></span>';
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

// Call this plugin in tooltip's afterLabel callback to set the size appropriately for use of thumbnail_tooltip()
function tt_size_plugin(context) {
	let default_x = context.chart.options.plugins.tooltip.x || Chart.defaults.plugins.tooltip.padding
	let new_padding = default_x + (context.chart.tooltip.height - default_x)/2
	if (new_padding && new_padding != context.chart.options.plugins.tooltip.padding.x) {
		context.chart.options.plugins.tooltip.padding = {
			x: new_padding,
			y: context.chart.options.plugins.tooltip.y || Chart.defaults.plugins.tooltip.padding,
		}
		context.chart.update('none')
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
if (typeof Chart !== 'undefined') {
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
				ctx.arc(0, 0, Math.min(style.height/2, style.width/2), 0, 2*Math.PI, false);
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
	
	Chart.defaults.scales.logarithmic.ticks.callback = function(tick, index, ticks) {
		  return tick.toLocaleString()
		}
}


// https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '12px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Ariel';
  
  return fontWeight + ' ' + fontSize + ' ' + fontFamily;
}

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function divideString(text) {
	let tokens = text.split(' ')
	if (tokens.length<2)
		return [text,'']
	let diff = text.length
	let i=1
	for (; i<tokens.length; i++)
	{
		let newdiff = Math.abs(tokens.slice(0,i).join(' ').length-tokens.slice(i).join(' ').length)
		if (newdiff>diff)
			break;
		diff = newdiff
	}
	return [tokens.slice(0,i-1).join(' '),tokens.slice(i-1).join(' ')]
	
}

function CreateOpCheckbox(operator, data1map = null, data2map = null, colorScaleMax = null, clickfunc = null, destDiv = document.getElementById("checkboxes"), order = null, skills = []) {
    let operatorName = operator.name;
    var checkboxDiv = document.createElement("div");
    checkboxDiv.classList.add('operatorCheckbox');
    checkboxDiv.setAttribute('data-class', operator.profession);
	checkboxDiv.setAttribute('data-rarity', operator.rarity);
    checkboxDiv.classList.add('show');
    if (order)
		checkboxDiv.style.order = order
	if (data1map) {
		let count = data1map[operatorName] || 0;
		let useDiv = document.createElement("div");
		useDiv.classList.add('data1');
		useDiv.innerHTML = count
		checkboxDiv.appendChild(useDiv);
		checkboxDiv.style.cssText = 'background: '+getColorForPercentage(count/colorScaleMax) +';'
	}
	if (data2map) {
		let riskDiv = document.createElement("div");
		riskDiv.classList.add('data2');
		riskDiv.innerHTML = data2map[operatorName] || 0
		checkboxDiv.appendChild(riskDiv);
	}
	
	let im = document.createElement('img');
	im.setAttribute('loading','lazy')
	im.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/' + operator.charId + '.png';
	checkboxDiv.appendChild(im);

    let name = document.createElement('div');
    name.classList.add('name');
	let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	let txt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
	txt.innerHTML = operatorName
	txt.setAttribute('x','50%')
	txt.setAttribute('y', '50%')
	txt.setAttribute('dominant-baseline', 'central')
	txt.setAttribute('text-anchor', 'middle')
	txt.setAttribute('lengthAdjust','spacingAndGlyphs')
	svg.appendChild(txt)
	name.appendChild(svg)
	
    checkboxDiv.appendChild(name);
	
	
	let skilldiv = document.createElement('div')
	skilldiv.classList.add('opskills')
	skills.forEach((sid,idx) => {
		let i = document.createElement('img')
		i.src = 'https://aceship.github.io/AN-EN-Tags/img/skills/skill_icon_' + sid + '.png'
		i.setAttribute('loading','lazy')
		i.classList.add('opskillCheckbox')
		skilldiv.appendChild(i)
		// if also clickfunc, need to call it while passing skill LIST.
		i.onclick = (e) => {
			e.stopPropagation()
			i.classList.toggle('_selected')
			if (i.classList.contains('_selected'))
				checkboxDiv.setAttribute('data-selsk',parseInt(checkboxDiv.getAttribute('data-selsk') || 0) | 1 << idx)
			else
				checkboxDiv.setAttribute('data-selsk',parseInt(checkboxDiv.getAttribute('data-selsk')) ^ 1 << idx)
			if (clickfunc) {
				clickfunc(operator, checkboxDiv.classList.contains('_selected'), parseInt(checkboxDiv.getAttribute('data-selsk')))
			}
		}
	})
	if (skills.length)
		checkboxDiv.appendChild(skilldiv)
	
    destDiv.appendChild(checkboxDiv);
	
	if (clickfunc) {
		checkboxDiv.onclick = (e) => {
			checkboxDiv.classList.toggle('_selected')
			clickfunc(operator, checkboxDiv.classList.contains('_selected'))
		}
	}

	// must do this after appending to body as we need computed styles.
	let nameWidth = getTextWidth(operatorName, getCanvasFontSize(name))
	let plateWidth = parseInt(getComputedStyle(checkboxDiv).width)
	if (nameWidth > plateWidth * 1.2 && operatorName.split(' ').length > 1) {
		// multiple words, split onto multiple lines.
		let [first,second] = divideString(operatorName)
		txt.setAttribute('y','35%')
		txt.setAttribute('x','0')
		txt.setAttribute('transform','scale(1,.75)')
		txt.innerHTML = ''
		// need to check width of each line and set textLength
		let firstLine = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
		firstLine.setAttribute('dy','0')
		firstLine.setAttribute('x','50%')
		if (getTextWidth(first, getCanvasFontSize(name)) > plateWidth)
			firstLine.setAttribute('textLength','100%')
		firstLine.innerHTML = first
		let secondLine = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
		secondLine.setAttribute('dy','1em')
		secondLine.setAttribute('x','50%')
		if (getTextWidth(second, getCanvasFontSize(name)) > plateWidth)
			secondLine.setAttribute('textLength','100%')
		secondLine.innerHTML = second
		txt.appendChild(firstLine)
		txt.appendChild(secondLine)
	}
	else if (nameWidth > plateWidth)
		txt.setAttribute('textLength','100%')
	
    return checkboxDiv;
}
