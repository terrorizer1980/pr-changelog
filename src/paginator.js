require("babel-polyfill")
var linkParser = require('parse-link-header')

module.exports = async function(originalOptions, func, filterFunc) {
  function getOptions(page) {
    let options = clone(originalOptions)
    options.per_page = 100
    options.page = page
    return options
  }

  let totalPages = 1
  let shouldUpdateTotalPagesOnNextPage = true

  function updateTotalPages(results) {
    let linkHeader = linkParser(results.meta.link)
    if (linkHeader && linkHeader.last) {
      shouldUpdateTotalPagesOnNextPage = false
      totalPages = parseInt(linkHeader.last.page)
    }
    else if (linkHeader && linkHeader.next) {
      shouldUpdateTotalPagesOnNextPage = true
      totalPages = parseInt(linkHeader.next.page)
    }
  }

  let allResults
  let results = await func(getOptions(1))
  updateTotalPages(results)

  if (filterFunc) allResults = filterFunc(results)

  try {
    for (let page = 2; page <= totalPages; page++) {
      console.log('fetching page', page);

      results = await func(getOptions(page))
      if (shouldUpdateTotalPagesOnNextPage && results.length)
        updateTotalPages(results)

      if (filterFunc) results = filterFunc(results)

      if (results == null)
        break
      else
        allResults = allResults.concat(results)
    }
  }
  catch (e) {
    console.log(e.message || e);
  }

  return allResults
}

function clone(obj) {
  var temp = {}
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      temp[key] = obj[key];
    }
  }
  return temp
}
