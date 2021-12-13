var charIdMap = {},
    operatorData,
    charNumMap = {},
    charCodeMap = {}
get_char_table()
	.then(js => {
    operatorData = js;
    for (var key in operatorData) {
        if (!operatorData[key].displayNumber) delete operatorData[key]
    }
    // for (var key in operatorData) {
        // charIdMap[operatorData[key].name] = key;
		// operatorData[key].charId = key;
    // }
	// charIdMap['Skadiva'] = 'char_1012_skadi2'
    for (var key in operatorData) {
        charNumMap[key.split('_')[1]] = key
        charCodeMap[key.split('_')[2]] = key
    }
    return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/story_table.json')
}).then(res => res.json()).then(js => {
    storyData = js;
    Object.keys(storyData).filter(x => x.startsWith('obt/memory/')).sort((a,b) => {
        let na = (operatorData[charCodeMap[a.split('/story_')[1].split('_')[0]]].name + ' ' + a.split('_').slice(-2).join('-')).toLowerCase()
        let nb = (operatorData[charCodeMap[b.split('/story_')[1].split('_')[0]]].name + ' ' + b.split('_').slice(-2).join('-')).toLowerCase()
        if (na < nb) return -1;
        if (nb < na) return 1;
        return 0;
    }).forEach(n => {
      let opt = document.createElement('option')
      opt.value = n
      opt.innerHTML = operatorData[charCodeMap[n.split('/story_')[1].split('_')[0]]].name + ' ' + n.split('_').slice(-2).join('-')
      document.getElementById('recordSelect').appendChild(opt)
    })
    document.getElementById('recordSelect').onchange = (e) => {
        genStory(document.getElementById('recordSelect').value)
    }
    // Object.keys(storyData).filter(x => x.startsWith('obt/memory/')).some(n=>{
      // genStory(n)
        // return true;      
    // })
})

function genStory(key) {
    fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/story/'+key+'.txt')
    .then(r => r.text())
    .then(txt => {
        const lines = txt.matchAll(/^(\[[^\]]+])?(.*)?$/gim)
        let storyDiv = document.getElementById('storyDisp')
        storyDiv.innerHTML = ''
        let scene,speaker,chars = {}
          for (const line of lines) {
              
              if (line[1]) {
                  [_,cmd,args] = /\[([^\(\]]+)(?:\((.+)\))?\]/.exec(line[1])
                  // stage
                  if (cmd.startsWith('name=')) {
                      args = cmd
                  }
                  if (args) {
                      let tmp = {}
                      Array.from(args.matchAll(/("?[^=", ]+"?)="?([^",]+)"?/gim)).forEach(l => {
                        tmp[l[1]] = l[2] 
                      })
                      args = tmp
                  }
                  
              }
              if (line[1] && line[2] && line[2].trim()) {
                  // group 1&2 indicates dialog with speaker.
                  if (scene)
                    scene.appendChild(makeDialog(args, line[2], chars, speaker))
              }
              else if (line[1]) {
                  // group 1 alone indicates stage direction
                  switch(cmd.toLowerCase()) {
                      case 'background':
                      // insert new div when background changes and set active to it.
                        if (scene)
                            storyDiv.appendChild(scene)
                        scene = document.createElement('div')
                        scene.classList.add('scene')
                        scene.style.backgroundImage = 'url(https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/'+args.image+'.png'
                        
                        
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
                      default:
                      break;
                  }
              }
              else if (line[2]) {
                  // group 2 alone indicates speakerless text (narrator)
                  if (scene)
                    scene.appendChild(makeDialog(null, line[2], chars, speaker))
              }
          }
          storyDiv.appendChild(scene)
    })
}

function makeDialog(args, dialogLine, chars, currentSpeaker) {
    let wrap = document.createElement('div')
    wrap.classList.add('dialog')
    
    let txt = document.createElement('div')
    txt.classList.add('text')
    txt.innerHTML = dialogLine
    wrap.appendChild(txt)
    
    function spacer() {
       let spacer = document.createElement('div')
        spacer.classList.add('avatar-spacer')
        return spacer
    }
    if (args) {
        let nameplate = document.createElement('span')
        nameplate.classList.add('name')
        nameplate.innerHTML = args.name
        txt.prepend(nameplate)
    
        Object.keys(chars).forEach( (key,i) => {
            let isActive = (currentSpeaker == 1 && key == 'name') || (key == 'name'+currentSpeaker)
            let avatar = document.createElement('img')
            avatar.classList.add('avatar')   
            avatar.classList.add('npc')            
            avatar.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/' + chars[key].replace(/(char_\d+_[^_]+)_.+/,'$1') + '.png'
            avatar.src = 'https://aceship.github.io/AN-EN-Tags/img/smallavg/characters/'+encodeURIComponent(chars[key])+'.png'
            let operator_charid = charNumMap[chars[key].split('_')[1]]
            if (operator_charid) {
                avatar.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/'+operator_charid+'.png'
                avatar.classList.remove('npc')
            }
            avatar.setAttribute('onerror',"console.log('not found:',this.src);this.classList.remove('npc');this.classList.add('unknown');this.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/avg_npc_012.png'")
            avatar.setAttribute('loading','lazy')
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