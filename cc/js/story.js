var operatorData,
    charNumMap = {},
    charCodeMap = {},
    currentCategory,
    storyData,
    storyReview,
    storyTypes = {record:[], main:[], side: [], mini:[]},
    storyTypeNames = {record:'Operator Record',main:'Main Story',side:'Side Story',mini:'Vignette'}
get_char_table()
	.then(js => {
    operatorData = js;
    for (var key in operatorData) {
        charNumMap[key.split('_')[1]] = key
        charCodeMap[key.split('_')[2]] = key
    }
    return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/story_table.json')
}).then(res => res.json()).then(js => {
    storyData = js
    return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/story_review_table.json')
}).then( res => res.json()).then(js=> {
    storyReview = js
    Object.values(storyReview).forEach(x => {
      if (x.id.startsWith('main_'))
          storyTypes.main.push(x.id)
      else if (x.id.startsWith('story_'))
          storyTypes.record.push(x.id)
      else if (x.entryType.startsWith('MINI_'))
          storyTypes.mini.push(x.id)
      else
          storyTypes.side.push(x.id)
    })
    
    storyTypes.record.sort((a,b) => {
        let na = (operatorData[charCodeMap[a.split('story_')[1].split('_')[0]]].name + ' ' + a.split('_').slice(-1)).toLowerCase()
        let nb = (operatorData[charCodeMap[b.split('story_')[1].split('_')[0]]].name + ' ' + b.split('_').slice(-1)).toLowerCase()
        if (na < nb) return -1;
        if (nb < na) return 1;
        return 0;
    })
        
        
    Object.keys(storyTypes).forEach(t => {
      let opt = document.createElement('option')
      opt.value = t
      opt.innerHTML = storyTypeNames[t]
      document.getElementById('catSelect').appendChild(opt)
    })
    function buildThirdSelector(uppercat,cat,trigger = true) {
        document.getElementById('thirdCatSelect').innerHTML = ''
        let stories = storyReview[cat].infoUnlockDatas
        
        // sort if needed:
        switch (uppercat) {
            case 'side':
            case 'mini':
            case 'main':
                // if main sort by story code:
                stories.sort((a,b) => {
                    let code_a = /\d+-\d+(_.)?/.exec(a.storyDependence) && /\d+-\d+(_.)?/.exec(a.storyDependence)[0]
                    let code_b = /\d+-\d+(_.)?/.exec(b.storyDependence) && /\d+-\d+(_.)?/.exec(b.storyDependence)[0]
                    if (/_spst_/.exec(b.storyId) || /_spst_/.exec(a.storyId)) {
                        if (code_b >= code_a) {
                            return -1
                        }
                        return 1
                    }
                    return 0
                })
            break;
        }
        stories.forEach((d,i) => {
            let name = d.storyName 

            switch(uppercat) {
                case 'main':
                case 'mini':
                case 'side':
                    if (d.storyCode) {
                        let pos = d.avgTag.split(' ')[0]
                        name = d.storyCode
                        if (['Before','After'].includes(pos))
                            name += ' ' + pos
                    }
                break
                case 'record':
                    if (stories.length > 1)
                        name += ' ['+(i+1)+']'
                break
            }
            let opt = document.createElement('option')
            opt.value = i
            opt.innerHTML = name
            document.getElementById('thirdCatSelect').appendChild(opt)
        })
        document.getElementById('thirdCatSelect').onchange = () => {
            // load the story.
            let data = storyReview[cat].infoUnlockDatas[document.getElementById('thirdCatSelect').value]
            genStory(data.storyName, data.storyTxt)
            window.location.hash = uppercat+'&'+cat+'&'+document.getElementById('thirdCatSelect').value
        }
        if (trigger)
            document.getElementById('thirdCatSelect').onchange()
    }
    function buildSecondSelector(cat, trigger = true) {
        document.getElementById('subCatSelect').innerHTML = ''
        let namefunc = (k) => k
        switch(cat) {
            case 'main':
                namefunc = (k) => 'Chapter '+k.split('_')[1].padStart(2,'0')
            break
            case 'record':
                namefunc = (n) => {
                    let name = operatorData[charCodeMap[n.split('story_')[1].split('_')[0]]].name
                    let storynum = parseInt(/set_(\d+)/i.exec(n)[1])
                    if (storynum > 1 || (n.slice(0,-1)+'2' in storyReview))
                        name+= ' [' + n.split('_').slice(-1)+']'
                    return name
                }
            break
            case 'mini':
            case 'side':
                namefunc = (k) => storyReview[k].name
            break
        }
        storyTypes[cat].forEach(k=>{
        let opt = document.createElement('option')
        opt.value = k
        
        opt.innerHTML = namefunc(k)
        document.getElementById('subCatSelect').appendChild(opt)
        })
        
        document.getElementById('subCatSelect').onchange = () => {
            buildThirdSelector(cat,document.getElementById('subCatSelect').value)
        }
        if (trigger)
            document.getElementById('subCatSelect').onchange()
    }
    document.getElementById('catSelect').onchange = () => {
        buildSecondSelector(document.getElementById('catSelect').value)
    }
    
    
    
    // nav buttons
    Array.from(document.getElementsByClassName('story_next')).forEach(e => {
        e.onclick = () => {
            let currentCategory = document.getElementById('thirdCatSelect')
            currentCategory.options[++currentCategory.selectedIndex%currentCategory.options.length].selected = true;
            currentCategory.onchange()
            topFunction()
        }
    })
    Array.from(document.getElementsByClassName('story_prev')).forEach(e => {
        e.onclick = () => {
            let currentCategory = document.getElementById('thirdCatSelect')
            currentCategory.options[(--currentCategory.selectedIndex+currentCategory.options.length)%currentCategory.options.length].selected = true;
            currentCategory.onchange()
            topFunction()
        }
    })
    function loadFromHash() {
        [uppercat,cat,idx] = window.location.hash.slice(1).split('&')
        Array.from(document.getElementById('catSelect').options).forEach(o => {
            if (o.value == uppercat)
                o.selected = true;
        })
        buildSecondSelector(uppercat, false)
        Array.from(document.getElementById('subCatSelect').options).forEach(o => {
            if (o.value == cat)
                o.selected = true;
        })
        buildThirdSelector(uppercat, cat, false)
        Array.from(document.getElementById('thirdCatSelect').options).forEach(o => {
            if (o.value == idx)
                o.selected = true;
        })
        document.getElementById('thirdCatSelect').onchange()
    }
    if (window.location.hash) {
        loadFromHash()
    } else
        document.getElementById('catSelect').onchange()
    window.onhashchange = loadFromHash
})



function genStory(storyName,key) {
    fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/story/'+key+'.txt')
    .then(r => r.text())
    .then(txt => {
        const lines = txt.matchAll(/^(\[[^\]]+])?(.*)?$/gim)
        let storyDiv = document.getElementById('storyDisp')
        storyDiv.innerHTML = ''
        let title = document.createElement('div')
        title.classList.add('storyName')
        title.innerHTML = storyName
        storyDiv.appendChild(title)
        let scene,speaker,chars = {},speakerList = new Set()
          for (const line of lines) {
              if (line[1]) {
                  [_,cmd,args] = /\[([^\(\]]+)(?:\((.+)\))?\]/.exec(line[1])
                  // stage
                  if (cmd.startsWith('name=')) {
                      args = cmd
                  }
                  if (args) {
                      let tmp = {}
                      Array.from(args.matchAll(/("?[^=", ]+"?)="?([^",]*)"?/gim)).forEach(l => {
                        tmp[l[1]] = l[2] 
                      })
                      args = tmp
                  }
                  
              }
              if (line[1] && line[1].startsWith('[name=') && line[2] && line[2].trim()) {
                  // group 1&2 indicates dialog with speaker.
                  speakerList.add(args.name.toLowerCase())
                  if (scene)
                    scene.appendChild(makeDialog(args, line[2], chars, speaker, Array.from(speakerList).indexOf(args.name.toLowerCase())))
              }
              else if (line[1]) {
                  // group 1 alone indicates stage direction
                  switch(cmd.toLowerCase()) {
                      case 'background':
                      // insert new div when background changes and set to current scene
                        if (scene)
                            storyDiv.appendChild(scene)
                        scene = document.createElement('div')
                        scene.classList.add('scene')
                        if (!args)
                            scene.style.backgroundImage = 'url(https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/bg_black.png)'
                        else
                            scene.style.backgroundImage = 'url(https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/'+args.image+'.png)'
                      break;
                      case 'character':
                        if (args) {
                            speaker = parseInt(args.focus) || 1 // set to 1 if focus key doesnt exist.
                            chars = args
                            Object.keys(chars).forEach( k => {
                              if (!k.startsWith('name'))
                                    delete chars[k]
                            })
                        }
                        else {
                            chars = {}
                            speaker = 0
                        }
                      break;
                      case 'dialog':
                            chars = {}
                            speaker = 0
                      break
                      default:
                      break;
                  }
              }
              else if (line[2]) {
                  // group 2 alone indicates speakerless text (narrator)
                  if (scene)
                    scene.appendChild(makeDialog(null, line[2], {}, 0))
              }
          }
          storyDiv.appendChild(scene)
    })
}

function selectColor(number) {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},15%,60%)`;
}

function makeDialog(args, dialogLine, chars, currentSpeaker, colorIndex = 0) {
    let wrap = document.createElement('div')
    wrap.classList.add('dialog')
    
    let txt = document.createElement('div')
    txt.classList.add('text')
    txt.setAttribute('data-name', '')
    txt.style.setProperty('--name-color','#777')
    txt.innerHTML = dialogLine
    wrap.appendChild(txt)
    
    function spacer() {
       let spacer = document.createElement('div')
        spacer.classList.add('avatar-spacer')
        return spacer
    }
    if (args) {
        txt.setAttribute('data-name', args.name)
        txt.style.setProperty('--name-color',selectColor(colorIndex))
        Object.keys(chars).forEach( (key,i) => {
            let isActive = (currentSpeaker == 1 && key == 'name') || (key == 'name'+currentSpeaker)
            let avatar = document.createElement('div')
            let img = document.createElement('img')
            avatar.classList.add('avatar')   
            avatar.classList.add('npc')    
            avatar.appendChild(img)
            img.src = 'https://aceship.github.io/AN-EN-Tags/img/avg/characters/'+encodeURIComponent(chars[key])+'.png'
            let fallbackimg = 'https://aceship.github.io/AN-EN-Tags/img/avg/characters/'+encodeURIComponent(chars[key].split('#')[0])+'.png'
            let operator_charid = charNumMap[chars[key].split('_')[1]]
            if (operator_charid) {
                img.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/'+operator_charid+'.png'
                avatar.classList.remove('npc')
            }
            img.onerror = () => {
                console.log('img not found:',img.src);
                img.src = fallbackimg
                img.onerror = () => {
                    console.log('fallback img not found:',img.src);
                    img.parentElement.classList.remove('npc');
                    img.parentElement.classList.add('unknown');
                    img.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/avg_npc_012.png'
                    img.onerror = null;
                }
            }
            img.setAttribute('loading','lazy')
            if (chars[key] == 'char_empty')
                avatar = spacer()
            if (isActive)
                avatar.classList.add('active')
            if (isActive)
                wrap.prepend(avatar)
            else 
                wrap.appendChild(avatar)
        })
    }
    if (Object.keys(chars).length < 1) {
        wrap.prepend(spacer()) 
    }
    if (Object.keys(chars).length < 2) {
        if (currentSpeaker < 0)
            wrap.prepend(spacer()) 
        else
            wrap.appendChild(spacer()) 
    }

    return wrap
}

//Get the button:
mybutton = document.getElementById("topBtn");
mybutton.onclick = topFunction

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}