import { Model, Schema, Types } from "mongoose"

export interface ISoftDeleteDocument {
    deletedAt: Date | null
    deletedBy: Types.ObjectId | null
    softDelete(deletedBy?: string): Promise<void>
    restore(): Promise<void>
}

export interface ISoftDeleteModel<T> extends Model<T> {
    softDeleteById(id: string, deletedBy?: string): Promise<void>
    restoreById(id: string): Promise<void>
}

export const SoftDeleteModelMiddleware = <T>(schema: Schema<T>) => {
    const excludeDeletedQuery = function (this: any) {
        if (!this.getFilter().includeDeleted) {
            this.setQuery({
                ...this.getFilter(),
                deletedAt: null,
            })
        } else {
            const query = { ...this.getFilter() }
            delete query.includeDeleted
            this.setQuery(query)
        }
    }

    // Query middleware
    schema.pre("find", excludeDeletedQuery)
    schema.pre("findOne", excludeDeletedQuery)
    schema.pre("findOneAndUpdate", excludeDeletedQuery)
    schema.pre("countDocuments", excludeDeletedQuery)

    // Instance method: soft delete
    schema.methods.softDelete = async function (deletedBy?: string) {
        this.deletedAt = new Date()
        this.deletedBy = deletedBy || null
        await this.save()
    }

    // Instance method: restore
    schema.methods.restore = async function () {
        this.deletedAt = null
        this.deletedBy = null
        await this.save()
    }

    // Static method: soft delete by ID
    schema.statics.softDeleteById = async function (id: string, deletedBy?: string) {
        const doc = await this.findById(id)
        if (doc) {
            await doc.softDelete(deletedBy)
        }
    }

    // Static method: restore by ID
    schema.statics.restoreById = async function (id: string) {
        const doc = await this.findById(id)
        if (doc) {
            await doc.restore()
        }
    }
}