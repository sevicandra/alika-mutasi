import fs from "fs";
import { Content } from "pdfmake/interfaces";
import generatePdf from "@/config/pdf.config";
import path from "path";
import { PegawaiMutasi, RefPejabat, Termin } from "@/models";
import { numberToWords } from "@/helpers/numberToWord.helper";
import { toTitleCase, snackToTitleCase } from "@/helpers/string.helper";
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
        const uang_harian = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "UANG_HARIAN"
        );
        const biaya_angkut_orang_art = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "BIAYA_ANGKUT_ORANG_ART"
        );
        const biaya_angkut_barang_art = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "BIAYA_ANGKUT_BARANG_ART"
        );
        const uang_harian_art = pegawai.RincianBiaya.filter(
          (rb) => rb.jenis === "UANG_HARIAN_ART"
        );
        const prev_termin = pegawai.Termin.filter(
          (t) => t.Ref.urutan < termin.Ref.urutan
        );
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
                              } orang @ ${b.harga_satuan.toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              )})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              ),
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
                              text: (b.volume * b.harga_satuan).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              ),
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
                              } orang @ ${b.harga_satuan.toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              )})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              ),
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
                              } orang @ ${b.harga_satuan.toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              )})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              ),
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
                              text: (b.volume * b.harga_satuan).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              ),
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
                              } orang @ ${b.harga_satuan.toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              )})`,
                              alignment: "left",
                              border: [true, false, true, false],
                            },
                            {
                              text: (b.volume * b.harga_satuan).toLocaleString(
                                "id-ID",
                                {
                                  currency: "IDR",
                                }
                              ),
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
                    text: pegawai.RincianBiaya.map(
                      (rb) => rb.harga_satuan * rb.volume
                    )
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
                    text: `${toTitleCase(
                      numberToWords(termin.nominal)
                    )} Rupiah`,
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
                            text: pegawai.RincianBiaya.map(
                              (rb) => rb.harga_satuan * rb.volume
                            )
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
                                .reduce((n, total) => n + total, 0) +
                              termin.nominal
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
                              pegawai.RincianBiaya.map(
                                (rb) => rb.harga_satuan * rb.volume
                              ).reduce((rb, total) => rb + total, 0) -
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
                            pegawai.Keluarga.filter(
                              (k) => k.status !== "TIDAK_TERTANGGUNG"
                            ).length > 0
                              ? pegawai.Keluarga.filter(
                                  (k) => k.status !== "TIDAK_TERTANGGUNG"
                                )
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
                                        text: new Date(
                                          k.tanggal_lahir
                                        ).toLocaleDateString("id-ID", {
                                          day: "2-digit",
                                          month: "long",
                                          year: "numeric",
                                        }),
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
                    } tanggal ${new Date(
                      pegawai.SuratKeputusan.tanggal
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`,
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
                    stack: [
                      `Nomor: ${agenda.nomor}`,
                      pegawai.nama,
                      `NIP ${pegawai.nip}`,
                    ],
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
}
