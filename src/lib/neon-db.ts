import postgres from 'postgres';

const sql = postgres('postgresql://neondb_owner:npg_vid6DOjXQK9l@ep-calm-firefly-af5f7ikc-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

class NeonDB {
  async create(collection: string, item: any) {
    try {
      const [newItem] = await sql`
        insert into ${sql(collection)} ${sql(item)}
        returning *
      `;
      return { success: true, data: newItem };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getById(collection: string, id: string) {
    try {
      const [item] = await sql`
        select * from ${sql(collection)} where id = ${id}
      `;
      return { success: !!item, data: item };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getAll(collection: string) {
    try {
      const items = await sql`
        select * from ${sql(collection)}
      `;
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async update(collection: string, id: string, updates: any) {
    try {
      const [updatedItem] = await sql`
        update ${sql(collection)} set ${sql(updates)}
        where id = ${id}
        returning *
      `;
      return { success: true, data: updatedItem };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async delete(collection: string, id: string) {
    try {
      await sql`
        delete from ${sql(collection)} where id = ${id}
      `;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const neonDB = new NeonDB();
