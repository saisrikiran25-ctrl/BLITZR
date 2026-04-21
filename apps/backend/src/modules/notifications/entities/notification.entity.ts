import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    notification_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ type: 'varchar', length: 100 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'varchar', length: 50 })
    type: 'TRADING' | 'PRICE_ALERT' | 'ARENA' | 'SYSTEM';

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
