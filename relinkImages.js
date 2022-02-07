// Re-link Images to Items after manual data move
// DISCORD: jbowens#0415 
// Updated for FoundryVTT v9

var examplefolderPath;
var folder;
var folderType;

handlefolderandtypeForm();

// Collect the folder name and folder type whose data will be scanned and image location replaces
function handlefolderandtypeForm() {
  
  let entityType = CONST.COMPENDIUM_ENTITY_TYPES.map(type => `<option value="${type}">${type}</option>`); 

  const folderform = `
    <p>Folder: <br>
    <input type="string" style="width:100%; margin-bottom:8px" id="gameFolder">
    </p>
    <p>
    Folder Type: <select id="entityType" />
      <option value="">--</option>
      ${entityType}
    </select>
    </p>
  `;

  new Dialog({
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
    <div style="display: block;">
      <p> Tell me what part of the image path to SEARCH for and what to REPLACE it with.</p>
      <p>SEARCH for:<br>
      <textarea type="string" name="removePath" style="width:100%;" rows="5">${examplefolderPath}</textarea> 
      </p>
      <p>REPLACE with:<br>
      <textarea type="string" name="addPath" style="width:100%;" rows="5"></textarea>
      </p>
  </div>
  `;

  // Display second dialog with imagePath ready for editing... 
  new Dialog({
    title: "Search and Replace",
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
    var j;
    var originalPath;
    var replacementPath;
    var tokenReplacementPath;
    var oldPath;
    var newPath;
    var entityId;
    var sceneTiles; 
    var sceneTilePath; 
    var originalTilePath; 
    var tileId;
    var update;
    var updates = [];
  
    oldPath = html.find("[name=removePath]")[0].value;
    newPath = html.find("[name=addPath]")[0].value;
  
    // for every entity in folder[0].content[] remove oldPath and replace it with newPath
    // then set the new image path back in the entity 
    for (i = 0; i < folder[0].content.length; i++) {
      replacementPath = "";
      originalPath =  folder[0].content[i].data.img;
      if (originalPath != "") replacementPath = originalPath.replace(oldPath, newPath); 
      entityId = folder[0].content[i].id;
      
      switch (folderType) {
        case "Actor":
          originalTilePath =  folder[0].content[i].data.token.img;
          tokenReplacementPath = originalTilePath.replace(oldPath, newPath); 
          update = { "_id": entityId, "img": replacementPath, "token.img": tokenReplacementPath };
          break;
        case "Scene":
          sceneTiles = duplicate(folder[0].content[i].data.tiles);
          for (j = 0; j < sceneTiles.length; j++) {
            sceneTilePath = sceneTiles[j].img;
            sceneTiles[j].img = sceneTilePath.replace(oldPath, newPath);
            tileId = sceneTiles[j]._id;
          }
          update = { "img": replacementPath, "tiles": sceneTiles };
          await game.scenes.updateAll(s => update, s => s.data.name == folder[0].content[i].data.name);  
        break;
        case "JournalEntry":
          update = { "_id": entityId, "img": replacementPath };    
          break;
        case "Item":
          update = { "_id": entityId, "img": replacementPath };          
          break;
       }
      updates.push(update);
    }
  
    switch (folderType) {
        case "Actor":
          await Actor.updateDocuments(updates);           
          break;
        case "Scene":
          // Had to await update in the individual scenes, since easch scenes is a double nested array of objects to included (Tiles) no idea why.          
          break;
        case "JournalEntry":
          await JournalEntry.updateDocuments(updates);    
          break;
        case "Item":
          await Item.updateDocuments(updates);          
          break;
       }
    
       return ui.notifications.info("relinking complete...");
  }
