# PDF invoice data extractor

## Features

- Focus on scanned documents with a scan resolution of 300 dpi and black and white only.

### Non-ML data extraction

Regular expressions are used to extract the field values from a text only version of the PDF document.

### ML data extraction

### PDF extraction pipeline

```
            scan              OCR            regex
1 document ------> N images -------> 1 text -------> N key-value pairs
                                                      (extracted_data)

```

### Validation pipeline

```
                   user validation
N key-value pairs ----------------> N key-value pairs
 (extracted_data)                    (validated_data)

```

### Learning pipeline




## Installation and Usage
