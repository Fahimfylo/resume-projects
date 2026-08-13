import { Table, type ITable } from './table.model';

export const tableRepository = {
  async create(data: Partial<ITable>): Promise<ITable> {
    return Table.create(data);
  },

  async findAll(): Promise<ITable[]> {
    return Table.find().populate({
      path: 'currentOrder',
      select: 'customerDetails',
    });
  },

  async findById(id: string): Promise<ITable | null> {
    return Table.findById(id);
  },

  async findByTableNo(tableNo: number): Promise<ITable | null> {
    return Table.findOne({ tableNo });
  },

  async update(
    id: string,
    data: { status?: string; currentOrder?: string }
  ): Promise<ITable | null> {
    return Table.findByIdAndUpdate(
      id,
      { status: data.status, currentOrder: data.currentOrder },
      { new: true }
    );
  },
};
