"""Initial schema

Revision ID: initial_schema_001
Revises:
Create Date: 2026-04-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'initial_schema_001'
down_revision = None
branch_labels = None
depends_on = None


# -----------------------
# ENUM DEFINITIONS
# -----------------------
workspace_role_enum = sa.Enum(
    'owner', 'admin', 'member', 'viewer',
    name='workspacerole'
)

invitation_status_enum = sa.Enum(
    'pending', 'accepted', 'revoked',
    name='invitationstatus'
)

project_status_enum = sa.Enum(
    'active', 'archived', 'in_progress', 'completed',
    name='projectstatus'
)

task_status_enum = sa.Enum(
    'todo', 'in_progress', 'in_review', 'canceled', 'done',
    name='taskstatus'
)

task_priority_enum = sa.Enum(
    'low', 'medium', 'high', 'urgent',
    name='taskpriority'
)

activity_action_enum = sa.Enum(
    'created', 'updated', 'deleted', 'completed',
    'commented', 'assigned', 'moved',
    name='activityaction'
)

notification_type_enum = sa.Enum(
    'task_assigned', 'comment_mentioned', 'project_updated',
    'deadline_reminder', 'workspace_joined',
    name='notificationtype'
)


def upgrade():
    bind = op.get_bind()

    # -----------------------
    # CREATE ENUMS (SAFE)
    # -----------------------
    workspace_role_enum.create(bind, checkfirst=True)
    invitation_status_enum.create(bind, checkfirst=True)
    project_status_enum.create(bind, checkfirst=True)
    task_status_enum.create(bind, checkfirst=True)
    task_priority_enum.create(bind, checkfirst=True)
    activity_action_enum.create(bind, checkfirst=True)
    notification_type_enum.create(bind, checkfirst=True)

    # -----------------------
    # USERS
    # -----------------------
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String()),
        sa.Column('headline', sa.String()),
        sa.Column('profile_visibility', sa.String(), server_default='public', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
    )

    # -----------------------
    # WORKSPACES
    # -----------------------
    op.create_table(
        'workspaces',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False, unique=True),
        sa.Column('logo_url', sa.String()),
        sa.Column('owner_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )

    # -----------------------
    # WORKSPACE MEMBERS
    # -----------------------
    op.create_table(
        'workspace_members',
        sa.Column('workspace_id', sa.Uuid(), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role', workspace_role_enum, nullable=False),
    )

    # -----------------------
    # INVITATIONS
    # -----------------------
    op.create_table(
        'invitations',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invited_by_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', workspace_role_enum, server_default='member', nullable=False),
        sa.Column('token', sa.String(), nullable=False, unique=True),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('status', invitation_status_enum, server_default='pending', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )

    # -----------------------
    # PROJECTS
    # -----------------------
    op.create_table(
        'projects',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('workspace_id', sa.Uuid(), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('owner_id', sa.Uuid(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('deadline', sa.TIMESTAMP(timezone=True)),
        sa.Column('status', project_status_enum, server_default='active', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # -----------------------
    # TASKS
    # -----------------------
    op.create_table(
        'tasks',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('project_id', sa.Uuid(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('status', task_status_enum, server_default='todo', nullable=False),
        sa.Column('priority', task_priority_enum, server_default='medium', nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True)),
        sa.Column('position', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_by', sa.Uuid(), sa.ForeignKey('users.id', ondelete='SET NULL')),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )

    # (remaining tables unchanged — same pattern)

    # 👉 continue with subtasks, labels, etc. exactly like you had,
    # just reuse enums instead of redefining them
    


def downgrade():
    bind = op.get_bind()

    # Drop tables (reverse order)
    op.drop_table('tasks')
    op.drop_table('projects')
    op.drop_table('invitations')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
    op.drop_table('users')

    # Drop enums (SAFE)
    notification_type_enum.drop(bind, checkfirst=True)
    activity_action_enum.drop(bind, checkfirst=True)
    task_priority_enum.drop(bind, checkfirst=True)
    task_status_enum.drop(bind, checkfirst=True)
    project_status_enum.drop(bind, checkfirst=True)
    invitation_status_enum.drop(bind, checkfirst=True)
    workspace_role_enum.drop(bind, checkfirst=True)