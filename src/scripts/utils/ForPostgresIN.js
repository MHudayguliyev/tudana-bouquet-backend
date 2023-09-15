const ForPostgresIN = async (arr) => {
  let result = "";
  let llength = false;
  let lslice = "";
  if (arr?.length > 0) {
    arr.split(",").forEach((wn) => {
      result += "'" + wn + "'" + ",";
    });
    let lastResult = result.split(",").toString();
    llength = lastResult.length > 3;
    lslice = lastResult.slice(0, -1);
    return { llength, lslice };
  }
  
  return { llength, lslice };

};

module.exports = ForPostgresIN;
