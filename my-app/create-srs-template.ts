import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 32, // 16pt (32 half-points)
          bold: true,
        },
        paragraph: {
          spacing: {
            before: 240,
            after: 120,
          },
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 28, // 14pt
          bold: true,
        },
        paragraph: {
          spacing: {
            before: 240,
            after: 120,
          },
        },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 24, // 12pt
          bold: true,
        },
        paragraph: {
          spacing: {
            before: 240,
            after: 120,
          },
        },
      },
      {
        id: "Heading4",
        name: "Heading 4",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 24,
          bold: true,
        },
        paragraph: {
          spacing: {
            before: 240,
            after: 120,
          },
        },
      }
    ],
  },
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          text: "文件编号：HB_HJ_RONGQIAN_SRS    密    级: 填写密级",
          alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "某控制系统虚拟仿真软件",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "软件需求规格说明",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "北京灏博云天科技有限公司",
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "签署页",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        new Paragraph({ text: "编制：           日期：           " }),
        new Paragraph({ text: "校对：           日期：           " }),
        new Paragraph({ text: "审核：           日期：           " }),
        new Paragraph({ text: "标审：           日期：           " }),
        new Paragraph({ text: "批准：           日期：           " }),
        new Paragraph({ text: "会签：           日期：           " }),
        
        new Paragraph({
          text: "文件更改记录表",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("序号")] }),
                new TableCell({ children: [new Paragraph("版本号")] }),
                new TableCell({ children: [new Paragraph("更改内容")] }),
                new TableCell({ children: [new Paragraph("更改人")] }),
                new TableCell({ children: [new Paragraph("更改日期")] }),
                new TableCell({ children: [new Paragraph("备注")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("1.")] }),
                new TableCell({ children: [new Paragraph("1.0")] }),
                new TableCell({ children: [new Paragraph("初稿")] }),
                new TableCell({ children: [new Paragraph("陈凯")] }),
                new TableCell({ children: [new Paragraph("2024.10.29")] }),
                new TableCell({ children: [new Paragraph("")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("2.")] }),
                new TableCell({ children: [new Paragraph("2.0")] }),
                new TableCell({ children: [new Paragraph("根据评审意见修改")] }),
                new TableCell({ children: [new Paragraph("陈凯")] }),
                new TableCell({ children: [new Paragraph("2024.11.05")] }),
                new TableCell({ children: [new Paragraph("")] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: "1 范围",
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
        }),
        new Paragraph({
          text: "1.1 标识",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: "本文档的代号为HB_HJ_RONGQIAN_SRS。" }),
        new Paragraph({ text: "本文档的版本号为2.0版。" }),
        new Paragraph({ text: "本文档的名称为某控制系统虚拟仿真软件软件需求规格说明。" }),
        new Paragraph({ text: "本文档适用于HB_HJ_RONGQIAN某控制系统虚拟仿真软件。" }),
        
        new Paragraph({
          text: "1.2 系统概述",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: "HB_HJ_RONGQIAN某控制系统虚拟仿真软件建设主要瞄准“虚实一体、理实结合”理念，按照“认识装备-学会操作-理解原理”的技能生成和能力培养逻辑..." }),
        
        new Paragraph({
          text: "1.3 文档概述",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: "在本文档中，第2章列出了本文档中引用的其它文档的信息，第3章详细描述了某控制系统虚拟仿真软件软件的各种需求以及实现方式..." }),

        new Paragraph({
          text: "2 引用文档",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "《某控制系统虚拟仿真软件软件研制任务书》。" }),

        new Paragraph({
          text: "3 需求",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: "3.1 要求的状态和方式",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: "某控制系统虚拟仿真软件软件无需多个运行状态和运行方式。" }),
        
        new Paragraph({
          text: "3.2 功能需求",
          heading: HeadingLevel.HEADING_2,
        }),
        
        // =============== 关键的 docxtemplater 模板区域 ===============
        new Paragraph({ text: "{#modules}" }),
        new Paragraph({
          text: "{name}",
          heading: HeadingLevel.HEADING_3, // 模块作为 Heading 3 (3.2.1 虚拟仿真软件)
        }),
        new Paragraph({ text: "{#features}" }),
        new Paragraph({
          text: "{name}",
          heading: HeadingLevel.HEADING_4, // 功能作为 Heading 4 (3.2.1.1 GN_XNCZXT 虚拟拆装系统)
        }),
        new Paragraph({ text: "{desc}" }),
        new Paragraph({ text: "{/features}" }),
        new Paragraph({ text: "{/modules}" }),
        // =========================================================

        new Paragraph({
          text: "3.3 人员需求",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: "本某控制系统虚拟仿真软件所面向的需求方中操作使用的人员，应对计算机及银河麒麟V10操作系统有一定的了解..." }),

        new Paragraph({
          text: "4 合格性规定",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "某控制系统虚拟仿真软件使用的合格性验证方法包括：演示、测试、分析、审查。" }),
        
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("SRS_Template.docx", buffer);
  console.log("SRS_Template.docx generated successfully.");
});
