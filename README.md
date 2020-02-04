# PDF invoice data extractor

## Features

- **INPUT**: PDFs with OCR text layer
- **OUTPUT**: Key-value pairs of invoice data
- Extracts invoice data by evaluating multiple regular expressions against the plain text of the pdf document
- Provides a GUI for data validation
- Electron app with node.js backend
- Vendor matching based on vat number (CHE-xxx.xxx.xxx), IBAN from separate CSV-list
- Export format options: JSON, XML
- Focus on scanned documents with a scan resolution of 300 dpi and black and white only.

## Screenshots

![GUI](docs/screenshot_01.png?raw=true "GUI screenshot")

## Motivation

- I needed a way to extract textual data from PDF documents specifically invoices.
- All available solutions required the upload of the PDF documents to a webservice which was not an option.
- Furthermore I required a solution to easily validate the extracted data with a GUI.

## Data extraction

Regular expressions are used to extract the field values from a text only version of the PDF document.

## PDF extraction pipeline

```
            scan                OCR            regex
1 document ------> 1-N images -------> 1 text -------> 1-N key-value pairs
                                                       (extracted_data)

```

## Validation pipeline

```
                     user validation
1-N key-value pairs ----------------> 1-N key-value pairs
(extracted_data)                      (validated_data)

```


## Installation and Usage

1. Clone git archive
2. cd into the directory
3. on the command line: `npm install`
4. start with: `npm start`

## npm-dependencies

These dependencies are installed by running `npm install`

- express: 4.17.1
- js2xmlparser: 4.0.0
- pdf.js-extract: 0.1.3
- electron: 6.0.12

## Packaged libraries

A pre-built version of the PDF.js viewer is included in this project.

- [pdfjs-2.2.228-dist](https://mozilla.github.io/pdf.js/getting_started/#download)
