// Re-link Images to Items after manual data move
// DISCORD: jbowens#0415  

var examplefolderPath;
var folder;
var folderType;

main()

async function main() {
    handlefolderandtypeForm();
}

// Collect the folder name and folder type whose data will be scanned and image location replaces
function handlefolderandtypeForm() {
  
  let entityType = COMPENDIUM_ENTITY_TYPES.map(type => `<option value="${type}">${type}</option>`); 

  const folderform = `
    <div style="display: inline-block; width: 100px">Folder:</div>
    <input type="string" id="gameFolder">
    <br />

    <div style="display: inline-block; width: 100px">Folder Type:</div>
    <select id="entityType" />
      <option value="">--</option>
      ${entityType}
    </select>
    <br />
  `;

  const dialog1 = new Dialog({
    title: "Select a folder that needs Image reLinking",
    content: folderform,
    buttons: {
      use: {
        label: "OK",
        callback: (html) => { exampleFolder (html); }
      }
    }
  }).render(true);
}

// Select the folder and type to determine the imagePath where Foundry thinks the images currently reside
function exampleFolder(html) {
  const gameFolder            = html.find(`input#gameFolder`)[0].value;
        folderType            = html.find(`select#entityType`)[0].value;
    
  // ask for the game folder that contains the objects that need a new image path
  // test to make sure there are the corrrect type and no duplicate folders with that name
  // also make sure to capture and check the entity type is correct (actor, item, journal, etc)
  folder = game.folders.filter(f => f.name === gameFolder && f.type === folderType); 
  
  if (folder.length != 0 && folder.length < 2) {
    // Select first token in gameFolder and set the examplePath
    examplefolderPath = folder[0].content[0].data.img; 
    handlepathForm(html);  
  }
  else return ui.notifications.error("folder doesnt exist or is a duplicate.");
}

function handlepathForm(html) {
  const pathform = `
  <div>Old Folder: <input type="string" name="removePath" value=${examplefolderPath} style="width:300px"/></div>
  <br />

  <div>New Folder: <input type="string" name="addPath" style="width:300px"/></div>
  <br />
  `;

  // Display second dialog with imagePath ready for editing... 
  const dialog2 = new Dialog({
    title: "Edit old path and copy in new path",
    content: pathform,
    buttons: {
      use: {
        label: "Apply",
        callback: (html) => { determinenewPath (html); }
      }
    }
  }).render(true);
}

async function determinenewPath(html) {
  // This form allows the editing of the original path found in the folderform to be edited
  // the user will remove the end of the path that remained the same after the move
  // the use will then input the new path (which can start no higher that the foundrydata directory where wolrds directory resides)
  
  var i;
  var originalPath;
  var replacementPath;
  var oldPath;
  var newPath;

  oldPath = html.find("[name=removePath]")[0].value;
  newPath = html.find("[name=addPath]")[0].value;

  // for every entity in folder[0].content[] remove oldPath and replace it with newPath
  // then set the new image path back in the entity 
  for (i = 0; i < folder[0].content.length; i++) {
    ui.notifications.info(`relinking... ${i} / ${folder[0].content.length}`);
    originalPath =  folder[0].content[i].data.img;
    replacementPath = originalPath.replace(oldPath, newPath);    
    folder[0].content[i].data.img = replacementPath;
    await folder[0].content[1].update({"img" : replacementPath});
    if (folderType == "Actor") {
      originalPath =  folder[0].content[i].data.token.img;
      replacementPath = originalPath.replace(oldPath, newPath);  
      folder[0].content[i].data.token.img = replacementPath;  
      await folder[0].content[1].update({"token.img" : replacementPath});
    }
  }
  return ui.notifications.info("relinking complete...");
}
