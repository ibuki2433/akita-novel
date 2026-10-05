import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

async function extract() {
  const dataBuffer1 = fs.readFileSync("C:\\Users\\User\\Downloads\\1.pdf");
  const data1 = await pdf(dataBuffer1);
  fs.writeFileSync("D:\\Bull\\เว็บนิยาย\\pdf1_extracted.txt", data1.text, "utf8");
  console.log("PDF 1 extracted length:", data1.text.length);

  const dataBuffer2 = fs.readFileSync("C:\\Users\\User\\Downloads\\2.pdf");
  const data2 = await pdf(dataBuffer2);
  fs.writeFileSync("D:\\Bull\\เว็บนิยาย\\pdf2_extracted.txt", data2.text, "utf8");
  console.log("PDF 2 extracted length:", data2.text.length);
}

extract().catch(console.error);
