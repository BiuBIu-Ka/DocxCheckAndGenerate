import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          text: "{title}",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: "文档简介：{description}",
        }),
        new Paragraph({
          text: "功能列表：",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: "{#features}",
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "功能名称：{name}",
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          text: "详细说明：{detail}",
        }),
        new Paragraph({
          text: "{/features}",
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("test-template.docx", buffer);
  console.log("Template generated at test-template.docx");
});
