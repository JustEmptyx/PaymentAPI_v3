const fs = require("fs")
async function createFile(fileName,data){
  fs.writeFileSync(fileName,data,function(error){if(error) throw error
  console.log('accountList file created')
  })
}

async function appendToDefinedFile(fileName,tagName,data){
  fs.appendFileSync(fileName,
      "\n\n" + "!========================================="+tagName+"=========================================!\n\n"+
      data, function(error){
   if(error) throw error;
   console.log('Данные успешно записаны записать файл');
  });
}

module.exports = {
    appendToDefinedFile,
    createFile
}