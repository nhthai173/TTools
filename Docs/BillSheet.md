# BillSheet(options `Object`)

A class to interact with Google Sheet

### options

| Name           | Type         | Description                                                                                                     | Example                 |
| -------------- | ------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------- |
| sheetId        | `string`   | GG Sheet id                                                                                                     |                         |
| sheetName      | `string`   | Sheet name                                                                                                      |                         |
| path           | `Object`   | Key-Index pairs                                                                                                 | {id: 0, name: 1}        |
| sortProp       | `string`   | Descending sort by a prop (usually timestamp)                                                                   |                         |
| sortType       | `string`   | `"string"` `"number"`                                                                                       |                         |
| emptyPropList  | `string[]` | A list of props are required. If it empty, the row be removed                                                   |                         |
| uniquePropList | `string[]` | A list of props are unique. If any row duplicate, the row be removed                                            |                         |
| transform      | `Object`   | A table containing functions whose input is the value of prop of the same name and the output is saved to sheet | {id: (val) => '#'+val } |
| fcustom        | `Function` | Like `transform` but this function run with each row and before `transform`                                 |                         |

### Methods

#### getAsJSON() `Object[]`

Get all sheet data as JSON by `path` option

#### sort() `void` ![](https://img.shields.io/badge/DEPRECATED-red)

Use `prettify` method instead

> Descending sort by `sortProp`, `sortType`. Remove empty row by `emptyPropList`, Remove duplicate row by `uniquePropList`

#### prettify() `void`

New name of `sort` method

#### append(data `{}|{}[]`) `boolean`

Append data to sheet. Return true if success

#### updateRow(query `{}`, nData `{}`) `boolean` ![](https://img.shields.io/badge/DEPRECATED-red)

Use `update` method instead`<br>`

> Find row by `query` and update it with `nData`. Return true if success

##### Arguments

| Name  | Type   | Description                     | Example                                                         |
| ----- | ------ | ------------------------------- | --------------------------------------------------------------- |
| query | `{}` | `propName` `"AND"` `"OR"` | {"name": "test"}`<br>`{"AND": {"name": "foo", "type": "bar"}} |
| nData | `{}` | row data                        | {"foo": "bar"}                                                  |

#### update(data `{}|{}[]`, idProps `string[]`) `boolean`

Update existing rows or append new rows if not exist. Return true if success`<br>`
Which rows to update is determined by value of each item in `idProps`. If `idProps` is not provided, append new rows.

##### Arguments

| Name    | Type         | Description   | Example        |                                               |
| ------- | ------------ | ------------- | -------------- | --------------------------------------------- |
| data    | `{}          | {}[]`         | row(s) data    | {"id": "1"}`<br>`[{"id": "1"}, {"id": "2"}] |
| idProps | `string[]` | id props list | ["id", "name"] |                                               |
