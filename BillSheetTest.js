/*
function BillSheet__test() {

  console.log('[1] Test error:')
  TEST.BillSheet__error.toJSON()

  console.log('[2] Test getJSON:')
  console.log(TEST.BillSheet.toJSON())

  console.log('[3] Test sort')
  TEST.BillSheet.sortProp = ''

}
*/





// The following test is not present in library export
const TEST = {}

/**
 * Missing input BillSheet.
 */
TEST.BillSheet__error = BillSheet()


TEST.BillSheet = BillSheet({
  sheetId: '1nCzYIC3MmL76allpjwO34spk5YJQp9v78kqx7IXnTj8',
  sheetName: 'event_in_year',
  path: {
    'type': 0,
    'code': 1,
    'priority': 2,
    'date': 3,
    'date_in_year': 4,
    'name': 5,
    'image_url': 6
  }
})