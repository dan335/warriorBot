const functions = {
  escapeMarkdown: function(str) {
    var unescaped = str.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
    var escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
    return escaped;
  },

  includesNoSpecialCharacters: function(str) {
    return str.match("^[a-zA-Z0-9.!? ]+$");
  },

  arrayMax: function(arr) {
    if (arr.length == 0) {
      return 0;
    }

    if (arr.length == 1) {
      return arr[0];
    }

    return arr.reduce((a, b) => {
      return Math.max(a, b);
    });
  }
}

export default functions
