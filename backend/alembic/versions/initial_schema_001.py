"""Initial schema

Revision ID: initial_schema_001
Revises: 
Create Date: 2026-04-15 19:18:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'initial_schema_001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Enums (Postgres-safe idempotency)
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspacerole') THEN
                CREATE TYPE workspacerole AS ENUM ('owner', 'admin', 'member', 'viewer');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitationstatus') THEN
                CREATE TYPE invitationstatus AS ENUM ('pending', 'accepted', 'revoked');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projectstatus') THEN
                CREATE TYPE projectstatus AS ENUM ('active', 'archived', 'in_progress', 'completed');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN
                CREATE TYPE taskstatus AS ENUM ('todo', 'in_progress', 'in_review', 'canceled', 'done');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskpriority') THEN
                CREATE TYPE taskpriority AS ENUM ('low', 'medium', 'high', 'urgent');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activityaction') THEN
                CREATE TYPE activityaction AS ENUM ('created', 'updated', 'deleted', 'completed', 'commented', 'assigned', 'moved');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
                CREATE TYPE notificationtype AS ENUM ('task_assigned', 'comment_mentioned', 'project_updated', 'deadline_reminder', 'workspace_joined');
            END IF;
        END $$;
    """)

    # --- Users Table ---
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('headline', sa.String(), nullable=True),
        sa.Column('profile_visibility', sa.String(), server_default='public', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # --- Workspaces Table ---
    op.create_table(
        'workspaces',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )

    # --- Workspace Members Table ---
    op.create_table(
        'workspace_members',
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('role', sa.Enum('owner', 'admin', 'member', 'viewer', name='workspacerole'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('workspace_id', 'user_id')
    )

    # --- Invitations Table ---
    op.create_table(
        'invitations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('invited_by_id', sa.Uuid(), nullable=False),
        sa.Column('role', sa.Enum('owner', 'admin', 'member', 'viewer', name='workspacerole'), server_default='member', nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', 'revoked', name='invitationstatus'), server_default='pending', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index(op.f('ix_invitations_email'), 'invitations', ['email'], unique=False)

    # --- Projects Table ---
    op.create_table(
        'projects',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('deadline', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('status', sa.Enum('active', 'archived', 'in_progress', 'completed', name='projectstatus'), server_default='active', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Tasks Table ---
    op.create_table(
        'tasks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('todo', 'in_progress', 'in_review', 'canceled', 'done', name='taskstatus'), server_default='todo', nullable=False),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'urgent', name='taskpriority'), server_default='medium', nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('position', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_priority'), 'tasks', ['priority'], unique=False)
    op.create_index(op.f('ix_tasks_status'), 'tasks', ['status'], unique=False)

    # --- Subtasks Table ---
    op.create_table(
        'subtasks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('is_done', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Task Assignees Table ---
    op.create_table(
        'task_assignees',
        sa.Column('task_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('assigned_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'user_id')
    )

    # --- Comments Table ---
    op.create_table(
        'comments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Labels Table ---
    op.create_table(
        'labels',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('color', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Task Labels Table ---
    op.create_table(
        'task_labels',
        sa.Column('task_id', sa.Uuid(), nullable=False),
        sa.Column('label_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['label_id'], ['labels.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'label_id')
    )

    # --- Webhooks Table ---
    op.create_table(
        'webhooks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Attachments Table ---
    op.create_table(
        'attachments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Activities Table ---
    op.create_table(
        'activities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=True),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('action', sa.Enum('created', 'updated', 'deleted', 'completed', 'commented', 'assigned', 'moved', name='activityaction'), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Uuid(), nullable=True),
        sa.Column('payload', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # --- Notifications Table ---
    op.create_table(
        'notifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('type', sa.Enum('task_assigned', 'comment_mentioned', 'project_updated', 'deadline_reminder', 'workspace_joined', name='notificationtype'), nullable=False),
        sa.Column('payload', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('notifications')
    op.drop_table('activities')
    op.drop_table('attachments')
    op.drop_table('webhooks')
    op.drop_table('task_labels')
    op.drop_table('labels')
    op.drop_table('comments')
    op.drop_table('task_assignees')
    op.drop_table('subtasks')
    op.drop_table('tasks')
    op.drop_table('projects')
    op.drop_table('invitations')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
    op.drop_table('users')
    
    op.execute("DROP TYPE notificationtype")
    op.execute("DROP TYPE activityaction")
    op.execute("DROP TYPE taskpriority")
    op.execute("DROP TYPE taskstatus")
    op.execute("DROP TYPE projectstatus")
    op.execute("DROP TYPE invitationstatus")
    op.execute("DROP TYPE workspacerole")
