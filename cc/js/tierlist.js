if (!window.location.hash) window.location.hash = '#4'
document.getElementById('clearsLink').href = './cc.html' + window.location.hash
window.onhashchange = () => window.location.reload()
var charIdMap = {},
    operatorData,
    CCTAG;
const tierMap = {6:'S',5:'A',4:'B',3:'C!',2:'D',1:'F'}
fetch('./json/cctitles.json').then(res => res.json()).then(json => {
    CCMAP = json;
    CCTAG = CCMAP[window.location.hash].tag
    document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
	if (window.location.hash == '#all')
		document.getElementById('clearsLink').style.display='none'
    Object.keys(CCMAP).forEach(k => {
      let btn = document.createElement('div')
      btn.classList.add('button')
      if (k==window.location.hash)
      btn.classList.add('checked')
      btn.innerHTML = k
      btn.onclick = () => {
          window.location.hash = btn.innerHTML
      }
      document.getElementById('ccselector').appendChild(btn)
    })
	return get_char_table()})
	.then(js => {
    operatorData = js;
    for (var key in operatorData) {
        if (!operatorData[key].displayNumber) delete operatorData[key]
    }
    for (var key in operatorData) {
        charIdMap[operatorData[key].name] = key;
		operatorData[key].charId = key;
    }
	charIdMap['Skadiva'] = 'char_1012_skadi2'
    return fetch('./json/data' + CCTAG + '.json')
}).then(res => res.json()).then(js => {
    clearData = js;
    var tldiv = document.getElementById('tierList')
	Object.values(tierMap).reverse().forEach(t => {
        let tdiv = document.createElement('div')
        tdiv.classList.add('tierRow')
        tldiv.appendChild(tdiv)
        let tlabel = document.createElement('div')
        tlabel.classList.add('tierLabel')
        tlabel.setAttribute('data-tier',t)
        tdiv.appendChild(tlabel)
        let tname = document.createElement('span')
        tname.innerHTML = t
        tlabel.appendChild(tname)
        let contents = document.createElement('div')
        contents.classList.add('tierMembers')
        tdiv.appendChild(contents)
        contents.id = t
    })
    var ops = {},max_score = 0,min_score = 9999999
    Object.values(clearData).forEach(c => {
        if (c.risk >= 18) {
            c.squad.forEach(charid => {
                ops[charid.name] = ops[charid.name] || {max: 0, score: 0}
                ops[charid.name].max = Math.max(ops[charid.name].max, c.risk)
                ops[charid.name].score += risk_weight(c.risk)
            })
        }
    })
    Object.keys(ops).forEach(k => {
      ops[k].score = ops[k].score/(Object.keys(clearData).length/25) + risk_weight(ops[k].max)*1.5
      if (ops[k].score > max_score)
            max_score = ops[k].score
        if (ops[k].score < min_score)
            min_score = ops[k].score
    })
    let bins = linspace(min_score,max_score,7)
    Object.keys(ops).forEach(charid => {
        for (let i = bins.length-2; i >= 0; i--) {
            if (bins[i] <= ops[charid].score) {
                CreateOpCheckbox(operatorData[charid],null, null, null, null, document.getElementById(tierMap[i+1]));
                break;
            }
        }
    })
})

function risk_weight(risk) {
    return Math.pow(risk-17,1.8)
}
function linspace(min,max,bins) {
    res = []
    for (let i = min; i<=max; i+=(max-min)/(bins-1))
        res.push(i)
    if (res.length < bins)
        res.push(max) // to avoid rounding removing the last bounds.
    return res
}