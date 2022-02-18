import { CsvBuilder } from 'filefy'

export const ExportCsv = (columns, data = [], filename = 'data', delimiter = ',') => {
  try {
    let finalData = data
    // Grab first item for data array, make sure it is also an array.
    // If it is an object, 'flatten' it into an array of strings.
    if (data.length && !Array.isArray(data[0])) {
      if (typeof data[0] === 'object') {
        // Turn data into an array of string arrays, without the `tableData` prop
        finalData = data.map(row =>
          columns.map(col =>
            col.exportTransformer ? col.exportTransformer(row.original[col.accessor]) : row.original[col.accessor],
          ),
        )
      }
    }
    const builder = new CsvBuilder(filename + '.csv')
    builder
      .setDelimeter(delimiter)
      .setColumns(columns.map(col => col.title))
      .addRows(Array.from(finalData))
      .exportFile()
  } catch (err) {
    console.error(`error in ExportCsv : ${err}`)
  }
}
