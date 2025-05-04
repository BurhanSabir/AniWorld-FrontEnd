import { getSupabaseClient } from "./client"

/**
 * Gets the actual column names for a table
 * @param tableName The name of the table to inspect
 * @returns A promise that resolves to an array of column names
 */
export async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    const supabase = getSupabaseClient()

    // Try to use the get_table_columns function if it exists
    const { data: functionData, error: functionError } = await supabase.rpc("get_table_columns", {
      table_name: tableName,
    })

    if (!functionError && functionData) {
      return functionData
    }

    // Fallback: try to infer columns from a query
    const { data, error } = await supabase.from(tableName).select("*").limit(1)

    if (error) {
      console.error(`Error inspecting table ${tableName}:`, error)
      return []
    }

    return data && data.length > 0 ? Object.keys(data[0]) : []
  } catch (error) {
    console.error(`Error inspecting table ${tableName}:`, error)
    return []
  }
}

/**
 * Checks if a table exists and has the expected columns
 * @param tableName The name of the table to check
 * @param expectedColumns The expected column names
 * @returns A promise that resolves to an object with the table status
 */
export async function inspectTable(
  tableName: string,
  expectedColumns: string[],
): Promise<{
  exists: boolean
  columns: string[]
  missingColumns: string[]
  extraColumns: string[]
  columnMapping: Record<string, string>
}> {
  try {
    const supabase = getSupabaseClient()

    // Check if table exists
    const { error } = await supabase.from(tableName).select("count").limit(1)

    const exists = !error || !error.message.includes("does not exist")

    if (!exists) {
      return {
        exists: false,
        columns: [],
        missingColumns: expectedColumns,
        extraColumns: [],
        columnMapping: {},
      }
    }

    // Get actual columns
    const columns = await getTableColumns(tableName)

    // Find missing and extra columns
    const columnsLower = columns.map((c) => c.toLowerCase())
    const expectedColumnsLower = expectedColumns.map((c) => c.toLowerCase())

    const missingColumns = expectedColumnsLower.filter((expected) => !columnsLower.includes(expected))

    const extraColumns = columnsLower.filter((actual) => !expectedColumnsLower.includes(actual))

    // Create column mapping (case-insensitive)
    const columnMapping: Record<string, string> = {}

    for (const expected of expectedColumns) {
      const matchingColumn = columns.find((c) => c.toLowerCase() === expected.toLowerCase())

      if (matchingColumn) {
        columnMapping[expected] = matchingColumn
      }
    }

    return {
      exists,
      columns,
      missingColumns,
      extraColumns,
      columnMapping,
    }
  } catch (error) {
    console.error(`Error inspecting table ${tableName}:`, error)
    return {
      exists: false,
      columns: [],
      missingColumns: expectedColumns,
      extraColumns: [],
      columnMapping: {},
    }
  }
}

/**
 * Fixes common database schema issues
 * @param tableName The name of the table to fix
 * @param columnDefinitions The column definitions to ensure
 * @returns A promise that resolves to a boolean indicating if the fix was successful
 */
export async function fixTableSchema(tableName: string, columnDefinitions: Record<string, string>): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Check if table exists
    const { error: tableError } = await supabase.from(tableName).select("count").limit(1)

    const tableExists = !tableError || !tableError.message.includes("does not exist")

    if (!tableExists) {
      // Table doesn't exist, create it
      const columns = Object.entries(columnDefinitions)
        .map(([name, type]) => `${name} ${type}`)
        .join(", ")

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${columns}
        );
      `

      const { error } = await supabase.rpc("execute_sql", {
        query: createTableSQL,
      })

      if (error) {
        console.error(`Error creating table ${tableName}:`, error)
        return false
      }

      return true
    }

    // Table exists, check columns
    const actualColumns = await getTableColumns(tableName)
    const actualColumnsLower = actualColumns.map((c) => c.toLowerCase())

    // Add missing columns
    for (const [columnName, columnType] of Object.entries(columnDefinitions)) {
      if (!actualColumnsLower.includes(columnName.toLowerCase())) {
        const addColumnSQL = `
          ALTER TABLE ${tableName}
          ADD COLUMN IF NOT EXISTS ${columnName} ${columnType};
        `

        const { error } = await supabase.rpc("execute_sql", {
          query: addColumnSQL,
        })

        if (error) {
          console.error(`Error adding column ${columnName} to ${tableName}:`, error)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error(`Error fixing table ${tableName}:`, error)
    return false
  }
}
