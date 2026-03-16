import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { RumorEntity } from './rumor.entity';

export enum VoteType {
    UP = 'UP',
    DOWN = 'DOWN',
}

@Entity('rumor_votes')
@Unique(['user_id', 'rumor_id'])
export class RumorVoteEntity {
    @PrimaryGeneratedColumn('uuid')
    vote_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'uuid' })
    rumor_id: string;

    @Column({
        type: 'enum',
        enum: VoteType,
    })
    vote_type: VoteType;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    // Relationships
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @ManyToOne(() => RumorEntity)
    @JoinColumn({ name: 'rumor_id' })
    rumor: RumorEntity;
}
