import fs from "fs";
import path from "path";
import { Content } from "pdfmake/interfaces";
import generatePdf from "@/config/pdf.config";
import { numberToWords } from "@/helpers/numberToWord.helper";
import { snackToTitleCase, toTitleCase } from "@/helpers/string.helper";
import { PegawaiMutasi, RefPejabat, SuratKeputusan, Termin } from "@/models";

export class PdfService {
  static async Header() {
    const imageData = fs
      .readFileSync(path.join(__dirname, "../../assets/logoKemenkeu.png"))
      .toString("base64");
    const header = [
      {
        table: {
          widths: ["auto", "*"],
          body: [
            [
              {
                image: `data:image/png;base64,${imageData}`,
                width: 62.65,
                rowSpan: 5,
                border: [false, false, false, false],
              },
              {
                text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA",
                alignment: "center",
                bold: true,
                fontSize: 13,
                border: [false, false, false, false],
              },
            ],
            [
              {},
              {
                text: "DIREKTORAT JENDERAL KEKAYAAN NEGARA",
                alignment: "center",
                bold: true,
                fontSize: 11,
                border: [false, false, false, false],
              },
            ],
            [
              {},
              {
                text: "SEKRETARIAT DIREKTORAT JENDERAL KEKAYAAN NEGARA",
                alignment: "center",
                fontSize: 11,
                bold: true,
                border: [false, false, false, false],
              },
            ],
            [
              {},
              {
                text: "",
                alignment: "center",
                fontSize: 11,
                bold: true,
                border: [false, false, false, false],
              },
            ],
            [
              {},
              {
                text: "GEDUNG SYAFRUDIN PRAWIRANEGARA II LANTAI 10 SELATAN JALAN LAPANGAN BANTENG TIMUR NO. 2-4 JAKARTA 10710 KOTAK POS 3169 TELP. (021) 3810162 ext.4550 situs: http://www.djkn.kemenkeu.go.id",
                alignment: "center",
                fontSize: 7,
                border: [false, false, false, false],
              },
            ],
            [
              {
                text: "",
                colSpan: 2,
                border: [false, false, false, true],
              },
              {},
            ],
          ],
        },
      },
    ];
    return header as Content[];
  }
  static async RincianBiaya({
    pegawai,
    ppk,
    bendahara,
    termin,
    agenda,
  }: {
    pegawai: PegawaiMutasi;
    ppk: RefPejabat;
    bendahara: RefPejabat;
    termin: Termin;
    agenda: {
      nomor: string;
      tanggal: string;
    };
  }): Promise<String> {
    return new Promise(async (resolve, reject) => {
      try {
        const header = await this.Header();
        const biaya_angkut_orang = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "BIAYA_ANGKUT_ORANG"
        );
        const biaya_angkut_barang = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "BIAYA_ANGKUT_BARANG"
        );
        const uang_harian = pegawai.RincianBiaya.filter((rb) => rb.jenis === "UANG_HARIAN");
        const biaya_angkut_orang_art = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "BIAYA_ANGKUT_ORANG_ART"
        );
        const biaya_angkut_barang_art = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "BIAYA_ANGKUT_BARANG_ART"
        );
        const uang_harian_art = pegawai.RincianBiaya.filter((rb) => rb.jenis === "UANG_HARIAN_ART");
        const prev_termin = pegawai.Termin.filter((t) => t.Ref.urutan < termin.Ref.urutan);
        let i = 1;
        const body = [
          {
            text: "RINCIAN BIAYA PERJALANAN DINAS",
            margin: [0, 10, 0, 0],
            alignment: "center",
          },
          {
            table: {
              widths: ["auto", "auto", "*"],
              body: [
                [
                  { text: "Lampiran SPD Nomor", alignment: "left" },
                  { text: ":", alignment: "center" },
                  { text: `${agenda.nomor}`, alignment: "left" },
                ],
                [
                  { text: "Tanggal", alignment: "left" },
                  { text: ":", alignment: "center" },
                  { text: `${agenda.tanggal}`, alignment: "left" },
                ],
              ],
            },
            margin: [0, 10, 0, 0],
            layout: "noBorders",
          },
          {
            table: {
              widths: ["auto", "*", "auto", "auto"],
              body: [
                [
                  {
                    text: "No.",
                    alignment: "center",
                  },
                  { text: "Rincian Biaya", alignment: "center" },
                  { text: "Jumlah (Rp.)", alignment: "center" },
                  { text: "Keterangan", alignment: "center" },
                ],
                ...(biaya_angkut_orang.length > 0
                  ? [
                      [
                        {
                          text: `${i++}`,
                          alignment: "center",
                          border: [true, false, true, false],
                        },
                        {
                          text: "Biaya Angkutan Pegawai dan Keluarga",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "right",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                      ],
                      ...biaya_angkut_orang
                        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                        .map((b) => {
                          return [
                            {
                              text: "",
                              border: [true, false, true, false],
                            },
                            {
                              text: `- ${toTitleCase(b.sub_jenis)} (${
                                b.volume
                              } orang @ ${b.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                              alignment: "right",
                              border: [true, false, true, false],
                            },
                            {
                              text: toTitleCase(b.keterangan),
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                          ];
                        }),
                    ]
                  : [
                      [
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                      ],
                    ]),
                ...(biaya_angkut_barang.length > 0
                  ? [
                      [
                        {
                          text: `${i++}`,
                          alignment: "center",
                          border: [true, false, true, false],
                        },
                        {
                          text: "Biaya Angkutan Barang Pegawai dan Keluarga",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "right",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                      ],
                      ...biaya_angkut_barang
                        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                        .map((b) => {
                          return [
                            {
                              text: "",
                              border: [true, false, true, false],
                            },
                            {
                              text: `- ${toTitleCase(b.sub_jenis)} (${
                                b.volume
                              } m3 @ ${b.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                              alignment: "right",
                              border: [true, false, true, false],
                            },
                            {
                              text: toTitleCase(b.keterangan),
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                          ];
                        }),
                    ]
                  : [
                      [
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                      ],
                    ]),
                ...(uang_harian.length > 0
                  ? [
                      [
                        {
                          text: `${i++}`,
                          alignment: "center",
                          border: [true, false, true, false],
                        },
                        {
                          text: "Uang Harian Perjalanan Dinas Pegawai dan Keluarga",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "right",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                      ],
                      ...uang_harian
                        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                        .map((b) => {
                          return [
                            {
                              text: "",
                              border: [true, false, true, false],
                            },
                            {
                              text: `- ${toTitleCase(b.sub_jenis)} (${
                                b.volume
                              } orang @ ${b.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                              alignment: "right",
                              border: [true, false, true, false],
                            },
                            {
                              text: toTitleCase(b.keterangan),
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                          ];
                        }),
                    ]
                  : [
                      [
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                      ],
                    ]),
                ...(biaya_angkut_orang_art.length > 0
                  ? [
                      [
                        {
                          text: `${i++}`,
                          alignment: "center",
                          border: [true, false, true, false],
                        },
                        {
                          text: "Biaya Angkutan ART",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "right",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                      ],
                      ...biaya_angkut_orang_art
                        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                        .map((b) => {
                          return [
                            {
                              text: "",
                              border: [true, false, true, false],
                            },
                            {
                              text: `- ${toTitleCase(b.sub_jenis)} (${
                                b.volume
                              } orang @ ${b.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                              alignment: "right",
                              border: [true, false, true, false],
                            },
                            {
                              text: toTitleCase(b.keterangan),
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                          ];
                        }),
                    ]
                  : [
                      [
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                      ],
                    ]),
                ...(biaya_angkut_barang_art.length > 0
                  ? [
                      [
                        {
                          text: `${i++}`,
                          alignment: "center",
                          border: [true, false, true, false],
                        },
                        {
                          text: "Biaya Angkutan Barang ART",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "right",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                      ],
                      ...biaya_angkut_barang_art
                        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                        .map((b) => {
                          return [
                            {
                              text: "",
                              border: [true, false, true, false],
                            },
                            {
                              text: `- ${toTitleCase(b.sub_jenis)} (${
                                b.volume
                              } m3 @ ${b.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                              alignment: "right",
                              border: [true, false, true, false],
                            },
                            {
                              text: toTitleCase(b.keterangan),
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                          ];
                        }),
                    ]
                  : [
                      [
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                      ],
                    ]),
                ...(uang_harian_art.length > 0
                  ? [
                      [
                        {
                          text: `${i++}`,
                          alignment: "center",
                          border: [true, false, true, false],
                        },
                        {
                          text: "Uang Harian Perjalanan Dinas ART",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "right",
                          border: [true, false, true, false],
                        },
                        {
                          text: "",
                          alignment: "left",
                          border: [true, false, true, false],
                        },
                      ],
                      ...uang_harian_art
                        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                        .map((b) => {
                          return [
                            {
                              text: "",
                              border: [true, false, true, false],
                            },
                            {
                              text: `- ${toTitleCase(b.sub_jenis)} (${
                                b.volume
                              } orang @ ${b.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                              alignment: "right",
                              border: [true, false, true, false],
                            },
                            {
                              text: toTitleCase(b.keterangan),
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                          ];
                        }),
                    ]
                  : [
                      [
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                        { text: "", border: [true, false, true, false] },
                      ],
                    ]),
                [
                  {
                    text: "Jumlah Biaya Perjalanan Dinas (Rp.)",
                    alignment: "center",
                    colSpan: "2",
                  },
                  {},
                  {
                    text: pegawai.RincianBiaya.map((rb) => rb.harga_satuan * rb.volume)
                      .reduce((rb, total) => rb + total, 0)
                      .toLocaleString("id-ID", {
                        currency: "IDR",
                      }),
                    alignment: "right",
                  },
                  {
                    text: "",
                    alignment: "left",
                  },
                ],
                [
                  {
                    text: "Dibayarkan Pada Termin Sebelumnya (Rp.)",
                    alignment: "center",
                    colSpan: "2",
                  },
                  {},
                  {
                    text: prev_termin
                      .map((pt) => pt.nominal)
                      .reduce((n, total) => n + total, 0)
                      .toLocaleString("id-ID", {
                        currency: "IDR",
                      }),
                    alignment: "right",
                  },
                  {
                    text: "",
                    alignment: "left",
                  },
                ],
                [
                  {
                    text: `Jumlah ${snackToTitleCase(termin.Ref.nama)} (Rp.)`,
                    alignment: "center",
                    colSpan: "2",
                  },
                  {},
                  {
                    text: termin.nominal.toLocaleString("id-ID", {
                      currency: "IDR",
                    }),
                    alignment: "right",
                  },
                  {
                    text: "",
                    alignment: "left",
                  },
                ],
                [
                  {
                    text: `${toTitleCase(numberToWords(termin.nominal))} Rupiah`,
                    alignment: "center",
                    colSpan: "4",
                  },
                  {},
                  {},
                  {},
                ],
              ],
            },
            margin: [0, 10, 0, 0],
          },
          {
            margin: [0, 10, 0, 0],
            table: {
              widths: ["*", "30%"],
              heights: ["auto", "auto", "auto", 50, "auto", "auto", "auto"],
              body: [
                [
                  {
                    text: "Telah dibayar sejumlah:",
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                  {
                    text: "Telah menerima sebesar:",
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                ],
                [
                  {
                    text: `Rp. ${termin.nominal.toLocaleString("id-ID", {
                      currency: "IDR",
                    })}`,
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                  {
                    text: `Rp. ${termin.nominal.toLocaleString("id-ID", {
                      currency: "IDR",
                    })}`,
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                ],
                [
                  {
                    text: "Bendahara Pengeluaran",
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                  {
                    text: "Yang Menerima",
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                ],
                [
                  { text: "", border: [false, false, false, false] },
                  { text: "", border: [false, false, false, false] },
                ],
                [
                  {
                    text: "##PLACEHOLDER_BENDAHARA##",
                    alignment: "left",
                    border: [false, false, false, false],
                    color: "white",
                    fontSize: 1,
                  },
                  {
                    text: "##PLACEHOLDER_PEGAWAI##",
                    alignment: "left",
                    border: [false, false, false, false],
                    color: "white",
                    fontSize: 1,
                  },
                ],
                [
                  {
                    text: bendahara.nama,
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                  {
                    text: pegawai.nama,
                    alignment: "left",
                    border: [false, false, false, false],
                  },
                ],
                [
                  {
                    text: `NIP ${bendahara.nip}`,
                    alignment: "left",
                    border: [false, false, false, true],
                  },
                  {
                    text: `NIP ${pegawai.nip}`,
                    alignment: "left",
                    border: [false, false, false, true],
                  },
                ],
              ],
            },
          },
          {
            unbreakable: true,
            margin: [0, 10, 0, 0],
            table: {
              widths: ["*", "30%"],
              heights: ["auto", "auto", "auto", 50, "auto", "auto", "auto"],
              body: [
                [
                  {
                    colSpan: 2,
                    text: "Perhitungan SPD Rampung",
                    alignment: "center",
                    margin: [0, 10, 0, 0],
                  },
                  {},
                ],
                [
                  {
                    table: {
                      widths: ["auto", "auto", "*"],
                      body: [
                        [
                          { text: "Ditetapkan Sejumlah", alignment: "left" },
                          { text: ":", alignment: "center" },
                          {
                            text: pegawai.RincianBiaya.map((rb) => rb.harga_satuan * rb.volume)
                              .reduce((rb, total) => rb + total, 0)
                              .toLocaleString("id-ID", {
                                currency: "IDR",
                              }),
                            alignment: "left",
                          },
                        ],
                        [
                          { text: "Yang Telah Dibayarkan", alignment: "left" },
                          { text: ":", alignment: "center" },
                          {
                            text: (
                              prev_termin
                                .map((pt) => pt.nominal)
                                .reduce((n, total) => n + total, 0) + termin.nominal
                            ).toLocaleString("id-ID", {
                              currency: "IDR",
                            }),
                            alignment: "left",
                          },
                        ],
                        [
                          { text: "Sisa Kurang/Lebih", alignment: "left" },
                          { text: ":", alignment: "center" },
                          {
                            text: (
                              pegawai.RincianBiaya.map((rb) => rb.harga_satuan * rb.volume).reduce(
                                (rb, total) => rb + total,
                                0
                              ) -
                              (prev_termin
                                .map((pt) => pt.nominal)
                                .reduce((n, total) => n + total, 0) +
                                termin.nominal)
                            ).toLocaleString("id-ID", {
                              currency: "IDR",
                            }),
                            alignment: "left",
                          },
                        ],
                      ],
                    },
                    margin: [0, 10, 0, 0],
                    layout: "noBorders",
                  },
                  {},
                ],
                [
                  {},
                  {
                    text: "Pejabat Pembuat Komitmen",
                    alignment: "left",
                  },
                ],
                [{}, {}],
                [
                  {},
                  {
                    text: "##PLACEHOLDER_PPK##",
                    alignment: "left",
                    color: "white",
                    fontSize: 1,
                  },
                ],
                [
                  {},
                  {
                    text: ppk.nama,
                    alignment: "left",
                  },
                ],
                [
                  {},
                  {
                    text: `NIP ${ppk.nip}`,
                    alignment: "left",
                  },
                ],
              ],
            },
            layout: "noBorders",
          },
        ] as Content[];
        const pdf = await generatePdf({
          json: [...header, ...body],
          margin: { top: 1, right: 1, bottom: 1, left: 1.5 },
          fontSize: 9,
        });
        resolve(pdf);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reject(error.message);
        } else {
          reject("Unknown error");
        }
      }
    });
  }
  static async Spd1({
    pegawai,
    ppk,
    agenda,
  }: {
    pegawai: PegawaiMutasi;
    ppk: RefPejabat;
    agenda: {
      nomor: string;
      tanggal: string;
    };
  }): Promise<String> {
    return new Promise(async (resolve, reject) => {
      try {
        const body = [
          {
            columns: [
              {
                width: "*",
                text: [
                  {
                    text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA\n",
                    fontSize: 11,
                  },
                  {
                    text: "DIREKTORAT JENDERAL KEKAYAAN NEGARA",
                    fontSize: 11,
                  },
                ],
              },
              {
                width: "auto",
                table: {
                  widths: ["auto", "auto", "*"],
                  body: [
                    [
                      { text: "Lembar Ke", alignment: "left" },
                      { text: ":", alignment: "center" },
                      { text: "1 (satu)", alignment: "left" },
                    ],
                    [
                      { text: "Nomor", alignment: "left" },
                      { text: ":", alignment: "center" },
                      { text: `${agenda.nomor}`, alignment: "left" },
                    ],
                  ],
                },
                layout: "noBorders",
              },
            ],
          },
          {
            text: "SURAT PERJALANAN DINAS (SPD)",
            margin: [0, 10, 0, 0],
            alignment: "center",
            fontSize: 11,
          },
          {
            table: {
              widths: ["auto", "*", "*"],
              body: [
                [
                  { text: "1.", alignment: "center" },
                  { text: "Pejabat Pembuat Komitmen", alignment: "left  " },
                  { text: ppk.nama, alignment: "left" },
                ],
                [
                  { text: "2.", alignment: "center" },
                  {
                    text: "Nama/NIP Pegawai Yang Melaksanakan Perjalanan Dinas",
                    alignment: "left ",
                  },
                  {
                    text: `${pegawai.nama} / ${pegawai.nip}`,
                    alignment: "left",
                  },
                ],
                [
                  { text: "3.", alignment: "center", rowSpan: 3 },
                  {
                    text: "a. Pangkat/Gol",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: `a. ${pegawai.Golongan.nama}/${pegawai.Golongan.kode}`,
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "b. Jabatan",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: `b. ${pegawai.SuratKeputusan.jenjang}`,
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "c. Tingkat/Biaya Perjalanan Dinas",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: "c. C",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  { text: "4.", alignment: "center" },
                  { text: "Maksud Perjalanan Dinas", alignment: "left" },
                  { text: "Perjalanan Dinas Pindah", alignment: "left" },
                ],
                [
                  { text: "5.", alignment: "center" },
                  { text: "Alat Angkut Yang Digunakan", alignment: "left" },
                  { text: "UDARA/DARAT", alignment: "left" },
                ],
                [
                  { text: "6.", alignment: "center", rowSpan: 2 },
                  {
                    text: "a. Tempat Berangkat",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: `a. ${pegawai.KantorAsal.Kota.kota}`,
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "b. Tempat Tujuan",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: `b. ${pegawai.KantorTujuan.Kota.kota}`,
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  { text: "7.", alignment: "center", rowSpan: 3 },
                  {
                    text: "a. Lamanya Perjalanan Dinas",
                    alignment: "left",
                    border: [true, true, true, false],
                  },
                  {
                    text: "a. 3 Hari",
                    alignment: "left",
                    border: [true, true, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "b. Tanggal Berangkat",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: "b. -",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "c. Tanggal Tiba di Tempat Baru",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: "c. -",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  { text: "8.", alignment: "center" },
                  {
                    stack: [
                      { text: "Pengikut :", alignment: "left" },
                      {
                        table: {
                          widths: ["auto", "*", "auto", "auto"],
                          body: [
                            [
                              { text: "No.", alignment: "left" },
                              { text: "Nama", alignment: "left" },
                              { text: "Tgl Lahir", alignment: "left" },
                              { text: "Keterangan", alignment: "left" },
                            ],
                            ...(pegawai.Keluarga &&
                            pegawai.Keluarga.filter((k) => k.status !== "TIDAK_TERTANGGUNG")
                              .length > 0
                              ? pegawai.Keluarga.filter((k) => k.status !== "TIDAK_TERTANGGUNG")
                                  .sort((a, b) => {
                                    const getPriority = (d: any) => {
                                      if (d.Ref.jenis === "PASANGAN") return 0;
                                      if (d.Ref.jenis === "ANAK") return 1;
                                      if (d.Ref.kode === 99) return 2;
                                      return 3;
                                    };
                                    return getPriority(a) - getPriority(b);
                                  })
                                  .map((k, i) => {
                                    return [
                                      { text: i + 1, alignment: "center" },
                                      { text: k.nama, alignment: "left" },
                                      {
                                        text: new Date(k.tanggal_lahir).toLocaleDateString(
                                          "id-ID",
                                          {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                          }
                                        ),
                                        alignment: "left",
                                      },
                                      { text: k.Ref.nama, alignment: "left" },
                                    ];
                                  })
                              : [
                                  [
                                    {
                                      text: "-",
                                      alignment: "center",
                                      colSpan: 4,
                                    },
                                    {},
                                    {},
                                    {},
                                  ],
                                ]),
                          ],
                        },
                      },
                    ],
                    alignment: "left",
                    colSpan: 2,
                  },
                  {},
                ],
                [
                  { text: "9.", alignment: "center", rowSpan: 3 },
                  {
                    text: "a. Dibebankan pada DIPA/POK",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: "Kantor Pusat Direktorat Jenderal Kekayaan Negara",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "b. Tahun Anggaran",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: pegawai.Termin.map((t) => {
                      return t.tahun;
                    }).join(" & "),
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  {},
                  {
                    text: "c. Akun",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                  {
                    text: "524111",
                    alignment: "left",
                    border: [true, false, true, false],
                  },
                ],
                [
                  { text: "10.", alignment: "center" },
                  { text: "Keterangan", alignment: "left" },
                  {
                    text: `Berdasarkan Surat Keputusan Nomor ${
                      pegawai.SuratKeputusan.nomor
                    } tanggal ${new Date(pegawai.SuratKeputusan.tanggal).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}`,
                    alignment: "left",
                  },
                ],
              ],
            },
            layout: {
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
            margin: [0, 10, 0, 0],
          },
          {
            table: {
              widths: ["*", "30%"],
              heights: ["auto", "auto", "auto", 80, "auto", "auto", "auto"],
              body: [
                [{}, { text: "Dikeluarkan di Jakarta", alignment: "left" }],
                [{}, { text: `Tanggal ${agenda.tanggal}`, alignment: "left" }],
                [{}, { text: "Pejabat Pembuat Komitmen", alignment: "left" }],
                [{}, {}],
                [
                  {},
                  {
                    text: "##PLACEHOLDER_PPK##",
                    alignment: "left",
                    color: "white",
                    fontSize: 1,
                  },
                ],
                [{}, { text: ppk.nama, alignment: "left" }],
                [{}, { text: `NIP ${ppk.nip}`, alignment: "left" }],
              ],
            },
            fontSize: 11,
            margin: [0, 10, 0, 0],
            layout: "noBorders",
          },
        ] as Content[];
        const pdf = await generatePdf({
          json: body,
          margin: { top: 1, right: 1, bottom: 1, left: 1.5 },
          fontSize: 11,
        });
        resolve(pdf);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reject(error.message);
        } else {
          reject("Unknown error");
        }
      }
    });
  }
  static async Spd2({
    pegawai,
    ppk,
    agenda,
  }: {
    pegawai: PegawaiMutasi;
    ppk: RefPejabat;
    agenda: {
      nomor: string;
      tanggal: string;
    };
  }): Promise<String> {
    return new Promise(async (resolve, reject) => {
      try {
        const body = [
          {
            table: {
              widths: ["auto", "*", "*"],
              body: [
                [
                  {
                    text: "I",
                    alignment: "center",
                  },
                  {
                    stack: [`Nomor: ${agenda.nomor}`, pegawai.nama, `NIP ${pegawai.nip}`],
                  },
                  {
                    table: {
                      widths: ["*"],
                      heights: ["auto", "auto", "auto", 100, "auto"],
                      body: [
                        [
                          {
                            text: `Berangkat dari: ${pegawai.KantorAsal.Kota.kota}`,
                            alignment: "left",
                          },
                        ],
                        [
                          {
                            text: `Ke: ${pegawai.KantorTujuan.Kota.kota}`,
                            alignment: "left",
                          },
                        ],
                        [
                          {
                            text: "Pada Tanggal:",
                            alignment: "left",
                          },
                        ],
                        [{}],
                        [
                          {
                            text: "##PLACEHOLDER_PEJABAT_KANTOR_ASAL##",
                            alignment: "left",
                            color: "white",
                            fontSize: 1,
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                ],
                [
                  {
                    text: "II",
                    alignment: "center",
                  },
                  {
                    table: {
                      widths: ["*"],
                      heights: ["auto", "auto", "auto", "auto", 100, "auto"],
                      body: [
                        [
                          {
                            text: `Tiba di: ${pegawai.KantorTujuan.Kota.kota}`,
                            alignment: "left",
                          },
                        ],
                        [
                          {
                            text: "Pada Tanggal:",
                            alignment: "left",
                          },
                        ],
                        [{ text: "", alignment: "left" }],
                        [
                          {
                            text: "",
                            alignment: "left",
                          },
                        ],
                        [{}],
                        [
                          {
                            text: "##PLACEHOLDER_PEJABAT_KANTOR_TUJUAN##",
                            alignment: "left",
                            color: "white",
                            fontSize: 1,
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                  {},
                ],
                [
                  {
                    text: "III",
                    alignment: "center",
                  },
                  {},
                  {
                    table: {
                      widths: ["*"],
                      heights: ["auto", "auto", 100, "auto", "auto"],
                      body: [
                        [
                          {
                            text: "Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilaksanakan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesiangkat-singkatnya.",
                            alignment: "justify",
                          },
                        ],
                        [
                          {
                            text: "Pejabat Pembuat Komitmen",
                            alignment: "left",
                          },
                        ],
                        [{ text: "", alignment: "left" }],
                        [
                          {
                            text: "##PLACEHOLDER_PPK##",
                            alignment: "left",
                            color: "white",
                            fontSize: 1,
                          },
                        ],
                        [
                          {
                            text: ppk.nama,
                            alignment: "left",
                          },
                        ],
                        [
                          {
                            text: `NIP ${ppk.nip}`,
                            alignment: "left",
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                ],
                [
                  {
                    text: "IV",
                    alignment: "center",
                  },
                  {
                    text: "Catatan Lain-Lain",
                  },
                  {
                    text: "Dikeluarkan di: Jakarta",
                  },
                ],
                [
                  {
                    text: "V",
                    alignment: "center",
                  },
                  {
                    colSpan: 2,
                    stack: [
                      "PERHATIAN",
                      "PPK yang menerbitkan SPD, Pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.",
                    ],
                  },
                  {},
                ],
              ],
            },
          },
        ] as Content[];
        const pdf = await generatePdf({
          json: body,
          margin: { top: 1, right: 1, bottom: 1, left: 1.5 },
          fontSize: 11,
        });
        resolve(pdf);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reject(error.message);
        } else {
          reject("Unknown error");
        }
      }
    });
  }
  static async OverviewSK({
    data,
    summary,
  }: {
    data: SuratKeputusan;
    summary: {
      total_pegawai: number;
      total_biaya: number;
      biaya_tertinggi: number;
      biaya_terendah: number;
      rata_rata_biaya: number;
      nilai_termin: {
        nama: string;
        nominal: number;
      }[];
    };
  }): Promise<String> {
    return new Promise(async (resolve, reject) => {
      try {
        const body = [
          {
            text: ["LAPORAN MUTASI PEGAWAI"],
            margin: [0, 0, 0, 10],
            fontSize: 14,
            bold: true,
          },
          {
            stack: [
              `Surat Keputusan Nomor ${data.nomor}`,
              `Tanggal ${new Date(data.tanggal).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}`,
              `Tentang ${data.uraian}`,
            ],
            margin: [0, 0, 0, 10],
            fontSize: 12,
          },
          {
            text: "RINGKASAN EKSEKUTIF",
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10],
          },
          {
            stack: [
              `Laporan ini merangkum pelaksanaan pemindahan ${
                summary.total_pegawai
              } pegawai berdasarkan Surat Keputusan Nomor ${
                data.nomor
              } dengan total anggaran ${summary.total_biaya.toLocaleString("id-ID", {
                currency: "IDR",
                style: "currency",
              })}. Pembayaran dilaksanakan dalam ${
                summary.nilai_termin.length
              } termin dengan rincian sebagai berikut:`,
              ...summary.nilai_termin.map((t) => {
                return `- ${t.nama}: ${t.nominal.toLocaleString("id-ID", {
                  currency: "IDR",
                  style: "currency",
                })}`;
              }),
            ],
            margin: [0, 0, 0, 10],
          },
          {
            text: "STATISTIK UTAMA",
            margin: [0, 0, 0, 10],
            fontSize: 14,
            bold: true,
          },
          {
            columnGap: 10,
            columns: [
              {
                width: "*",
                text: "",
              },
              {
                width: "50%",
                table: {
                  widths: ["50%", "50%"],
                  body: [
                    [
                      {
                        text: "Indikator",
                        alignment: "center",
                        padding: [0, 5, 0, 5],
                      },
                      {
                        text: "Nilai",
                        alignment: "center",
                        padding: [0, 5, 0, 5],
                      },
                    ],
                    [
                      {
                        text: "Total Pegawai",
                        alignment: "left",
                        padding: [0, 5, 0, 5],
                      },
                      {
                        text: summary.total_pegawai.toLocaleString("id-ID"),
                        alignment: "right",
                        padding: [0, 5, 0, 5],
                      },
                    ],
                    [
                      {
                        text: "Total Biaya",
                        alignment: "left",
                        padding: [0, 5, 0, 5],
                      },
                      {
                        text: summary.total_biaya.toLocaleString("id-ID", {
                          currency: "IDR",
                          style: "currency",
                        }),
                        alignment: "right",
                        padding: [0, 5, 0, 5],
                      },
                    ],
                    [
                      {
                        text: "Biaya Tertinggi",
                        alignment: "left",
                        padding: [0, 5, 0, 5],
                      },
                      {
                        text: summary.biaya_tertinggi.toLocaleString("id-ID", {
                          currency: "IDR",
                          style: "currency",
                        }),
                        alignment: "right",
                        padding: [0, 5, 0, 5],
                      },
                    ],
                    [
                      {
                        text: "Biaya Terendah",
                        alignment: "left",
                        padding: [0, 5, 0, 5],
                      },
                      {
                        text: summary.biaya_terendah.toLocaleString("id-ID", {
                          currency: "IDR",
                          style: "currency",
                        }),
                        alignment: "right",
                        padding: [0, 5, 0, 5],
                      },
                    ],
                    [
                      {
                        text: "Rata-rata Biaya",
                        alignment: "left",
                        padding: [0, 5, 0, 5],
                      },
                      {
                        text: summary.rata_rata_biaya.toLocaleString("id-ID", {
                          currency: "IDR",
                          style: "currency",
                        }),
                        alignment: "right",
                        padding: [0, 5, 0, 5],
                      },
                    ],
                  ],
                },
              },
              {
                width: "*",
                text: "",
              },
            ],
            margin: [0, 0, 0, 10],
          },
          {
            text: "",
            pageBreak: "after",
            pageOrientation: "landscape",
          },
          {
            text: "DAFTAR PEGAWAI MUTASI",
            alignment: "center",
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10],
          },
          {
            table: {
              widths: ["5%", "20%", "4%", "16%", "20%", "23%", "12%"],
              body: [
                [
                  { text: "No", alignment: "center" },
                  { text: "Nama/NIP", alignment: "center" },
                  { text: "Gol", alignment: "center" },
                  { text: "Rute", alignment: "center" },
                  { text: "Keluarga", alignment: "center" },
                  { text: "Biaya", alignment: "center" },
                  { text: "Termin", alignment: "center" },
                ],
                ...data.Pegawai.sort((a, b) => {
                  return a.golongan.localeCompare(b.golongan);
                }).map((pegawai, index) => {
                  return [
                    { text: index + 1, alignment: "center" },
                    {
                      text: `${pegawai.nama} / ${pegawai.nip}`,
                      alignment: "left",
                    },
                    { text: pegawai.Golongan.kode, alignment: "center" },
                    {
                      stack: [
                        {
                          text: `${pegawai.KantorAsal.kantor} (${pegawai.KantorAsal.Kota.kota})`,
                        },
                        { text: " - " },
                        {
                          text: `${pegawai.KantorTujuan.kantor} (${pegawai.KantorTujuan.Kota.kota})`,
                        },
                      ],
                      alignment: "left",
                    },
                    {
                      ul: [
                        ...pegawai.Keluarga.sort((a, b) => {
                          const getPriority = (d: any) => {
                            if (d.Ref.jenis === "PASANGAN") return 0;
                            if (d.Ref.jenis === "ANAK") return 1;
                            if (d.Ref.kode === 99) return 2;
                            return 3;
                          };
                          return getPriority(a) - getPriority(b);
                        }).map((k) => {
                          return {
                            stack: [
                              `${k.nama} (${k.Ref.nama})`,
                              `${new Date(k.tanggal_lahir).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })} ${k.is_invant ? "(Invan)" : ""}`,
                              k.pekerjaan ? `${k.pekerjaan}` : "-",
                              k.status,
                            ],
                            alignment: "left",
                            margin: [0, 0, 0, 5],
                          };
                        }),
                        ...(pegawai.Keluarga.length === 0 ? ["Tidak ada keluarga"] : []),
                      ],
                      alignment: "left",
                    },
                    {
                      ul: [
                        ...pegawai.RincianBiaya.sort((a, b) => {
                          const getPriority = (d: any) => {
                            if (d.jenis === "BIAYA_ANGKUT_ORANG") return 0;
                            if (d.jenis === "BIAYA_ANGKUT_BARANG") return 1;
                            if (d.jenis === "UANG_HARIAN") return 2;
                            if (d.jenis === "BIAYA_ANGKUT_ORANG_ART") return 3;
                            if (d.jenis === "BIAYA_ANGKUT_BARANG_ART") return 4;
                            if (d.jenis === "UANG_HARIAN_ART") return 5;
                            return 6;
                          };
                          return (
                            getPriority(a) - getPriority(b) || (a.urutan || 99) - (b.urutan || 99)
                          );
                        }).map((rb) => {
                          return {
                            stack: [
                              rb.sub_jenis,
                              rb.keterangan,
                              `${rb.harga_satuan.toLocaleString("id-ID", {
                                currency: "IDR",
                              })} x ${rb.volume} = ${(rb.harga_satuan * rb.volume).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              )}`,
                            ],
                            alignment: "left",
                            margin: [0, 0, 0, 5],
                          };
                        }),
                        ...(pegawai.RincianBiaya.length === 0 ? ["Tidak ada rincian biaya"] : []),
                      ],
                    },
                    {
                      ul: [
                        ...pegawai.Termin.map((t) => {
                          return {
                            stack: [
                              `${t.Ref.nama} (${t.tahun})`,
                              `Rp. ${t.nominal.toLocaleString("id-ID", {
                                currency: "IDR",
                              })}`,
                            ],
                            alignment: "left",
                            margin: [0, 0, 0, 5],
                          };
                        }),
                        ...(pegawai.Termin.length === 0 ? ["Tidak ada termin"] : []),
                      ],
                    },
                  ];
                }),
              ],
            },
          },
        ] as Content[];
        const pdf = await generatePdf({
          json: body,
          margin: { top: 1, right: 1, bottom: 1, left: 1.5 },
          fontSize: 11,
          orientation: "portrait",
        });
        resolve(pdf);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reject(error.message);
        } else {
          reject("Unknown error");
        }
      }
    });
  }
}
