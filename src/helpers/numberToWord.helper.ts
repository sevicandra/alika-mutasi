export const numberToWords = (num: number) => {
  if (num === 0) return "nol";
  const ones = [
    "nol",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
    "dua belas",
    "tiga belas",
    "empat belas",
    "lima belas",
    "enam belas",
    "tujuh belas",
    "delapan belas",
    "sembilan belas",
  ];
  const tens = [
    "nol",
    "sepuluh",
    "dua puluh",
    "tiga puluh",
    "empat puluh",
    "lima puluh",
    "enam puluh",
    "tujuh puluh",
    "delapan puluh",
    "sembilan puluh",
  ];
  const scale = ["", "ribu", "juta", "milyar", "triliun", "kuadriliun"];

  function convert_hundreds(num: number) {
    let result = "";

    if (num > 99) {
      let hundred = Math.floor(num / 100);
      num = num % 100;
      if (hundred === 1) {
        result += "seratus";
      } else {
        result += ones[hundred] + " ratus";
      }
    }

    if (num > 19) {
      let ten = Math.floor(num / 10);
      num = num % 10;
      result += (result ? " " : "") + tens[ten];
    }

    if (num > 0) {
      result += (result ? " " : "") + ones[num];
    }

    return result;
  }
  const currency = Number(num).toFixed(2);
  let [wholenum, decnum] = currency.split(".");
  let wholeArr = Number(wholenum).toLocaleString("id-ID").split(".").reverse();
  let rettxt = "";

  wholeArr.forEach((chunk, index) => {
    const newChunk = parseInt(chunk);
    if (newChunk > 0) {
      rettxt =
        convert_hundreds(newChunk) +
        (scale[index] ? " " + scale[index] : "") +
        (rettxt ? " " + rettxt : "");
    }
  });

  if (parseInt(decnum) > 0) {
    rettxt += " dan ";
    if (parseInt(decnum) < 20) {
      rettxt += ones[parseInt(decnum)];
    } else if (parseInt(decnum) < 100) {
      rettxt += tens[Math.floor(parseInt(decnum) / 10)];
      if (parseInt(decnum) % 10 !== 0) {
        rettxt += " " + ones[parseInt(decnum) % 10];
      }
    }
  }

  return rettxt.trim();
};
