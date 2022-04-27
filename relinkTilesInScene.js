// Re-link Images to Items after manual data move
// DISCORD: jbowens#0415  

var examplefolderPath;

// Array of all tokens on the canvas: canvas.tokens.placeables

handlepathForm();

function handlepathForm(html) {
  const pathform = `
    <div style="display: block;">
      <p> Tell me what part of the image path to SEARCH for and what to REPLACE it with.</p>
      <p>SEARCH for:<br>
      <textarea type="string" name="removePath" style="width:100%;" rows="5">.png</textarea> 
      </p>
      <p>REPLACE with:<br>
      <textarea type="string" name="addPath" style="width:100%;" rows="5">.webp</textarea>
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
    var originalTilePath; 
    var update;
    var updates = [];
  
    oldPath = html.find("[name=removePath]")[0].value;
    newPath = html.find("[name=addPath]")[0].value;

    console.log("oldPath: " + oldPath);
    console.log("newPath: " + newPath);
  
    // for every entity in canvas.background.placeables remove oldPath and replace it with newPath
    // then set the new image path back in the entity 
    for (i = 0; i < canvas.background.placeables.length; i++) {

        replacementPath = "";
        originalPath =  canvas.background.placeables[i].data.img;
        if (originalPath != "") replacementPath = originalPath.replace(oldPath, newPath);

        console.log("originalPath: " + originalPath);
        console.log("replacementPath: " + replacementPath);

        entityId = canvas.background.placeables[i].id;

        console.log("entityId: " + entityId);
    
        originalTilePath =  canvas.background.placeables[i].data.img;
        tokenReplacementPath = originalTilePath.replace(oldPath, newPath); 

        console.log("tokenReplacementPath: " + tokenReplacementPath);
        update = { "_id": entityId, "img": replacementPath};
        
        updates.push(update);
    }

    await game.scenes.current.updateEmbeddedDocuments("Tile", updates);
    
    return ui.notifications.info("relinking complete...");
  }