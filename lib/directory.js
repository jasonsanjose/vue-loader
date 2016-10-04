var fs = require('fs')

function readFile (depName, loaderContext, callback) {
  loaderContext.resolve(loaderContext.context, depName, function (err, path) {
    if (err) {
      callback(err)
    } else {
      fs.readFile(path, 'utf8', callback)
    }
  })
}

module.exports = function (script, filename, needMap, loaderContext, callback) {
  // TODO options
  // - File extensions like .jade, .less based on default options?
  // - Multiple style sheets
  var inputs = [
    { filename: './index.js', name: 'script' },
    { filename: './template.html', name: 'template' },
    { filename: './style.css', name: 'style' }
  ]
  var output = {}

  // TODO Convert to promises, Promise.all()
  inputs.forEach(function (input) {
    readFile(input.filename, loaderContext, function (err, content) {
      output[input.name] = (err) ? false : { content: content, src: input.filename }

      // Completed loading all inputs
      if (Object.keys(output).length >= inputs.length) {
        output.style.scoped = true
        output.styles = (output.style !== false) ? [output.style] : []
        delete output.style

        callback(output)
      }
    })
  })
}
