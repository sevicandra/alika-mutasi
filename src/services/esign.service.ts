import { eSignConfig } from "@/config/esign.config";

export class EsignService {
  private static Credentials = Buffer.from(
    `${eSignConfig.CLIENT_ID}:${eSignConfig.CLIENT_PASSWORD}`
  ).toString("base64");
  static async processEsign({
    nik,
    passphrase,
    jenis,
    tujuan,
    perihal,
    blob,
    fileName,
    page,
    xAxis = 75,
    yAxis = 75,
    width = 25,
    height = 25,
    imageTTD,
    imageTTDName,
  }: {
    nik: string;
    passphrase: string;
    jenis: string;
    tujuan: string;
    perihal: string;
    blob: Blob;
    fileName: string;
    page: number;
    xAxis: number;
    yAxis: number;
    width?: number;
    height?: number;
    imageTTD: Blob;
    imageTTDName: string;
  }) {
    try {
      const formdata = new FormData();
      formdata.append("nik", nik);
      formdata.append("passphrase", passphrase);
      formdata.append("jenis_dokumen", jenis);
      formdata.append("tujuan", tujuan);
      formdata.append("perihal", perihal);
      formdata.append("tampilan", "visible");
      formdata.append("height", `${height}`);
      formdata.append("width", `${width}`);
      formdata.append("image", `true`);
      formdata.append("page", `${page}`);
      formdata.append("xAxis", `${xAxis}`);
      formdata.append("yAxis", `${yAxis}`);
      formdata.append("file", blob, fileName);
      formdata.append("imageTTD", imageTTD, imageTTDName);
      const sign = await fetch(`${eSignConfig.BASE_URI}/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.Credentials}`,
        },
        body: formdata,
      });
      if (!sign.ok) throw new Error(await sign.text());
      const result = await sign.arrayBuffer();
      const buffer = Buffer.from(result);
      const headers = sign.headers;
      const data = {
        date: headers.get("date"),
        id_dokumen: headers.get("id_dokumen"),
      };
      return {
        buffer: buffer,
        date: data.date,
        id_dokumen: data.id_dokumen,
      };
    } catch (error) {
      throw error;
    }
  }
}
