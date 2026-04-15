"""
Initial schema - production safe version

Revision ID: initial_schema_001
Revises:
Create Date: 2026-04-15
"""

from alembic import op
import sqlalchemy as sa

revision = "initial_schema_001"
down_revision = None
branch_labels = None
depends_on = None


# -----------------------------
# ENUM CREATION (SAFE / IDEMPOTENT)
# -----------------------------
def create_enum(enum_name: str, values: list[str]):
    values_sql = ", ".join(f"'{v}'" for v in values)

    op.execute(f"""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = '{enum_name}'
        ) THEN
            CREATE TYPE {enum_name} AS ENUM ({values_sql});
        END IF;
    END
    $$;
    """)


def drop_enum(enum_name: str):
    op.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE;")


# -----------------------------
# ENUMS
# -----------------------------
def upgrade():
    # ENUMS (created once safely)
    create_enum("workspacerole", ["owner", "admin", "member", "viewer"])
    create_enum("invitationstatus", ["pending", "accepted", "revoked"])
    create_enum("projectstatus", ["active", "archived", "in_progress", "completed"])
    create_enum("taskstatus", ["todo", "in_progress", "in_review", "canceled", "done"])
    create_enum("taskpriority", ["low", "medium", "high", "urgent"])
    create_enum("activityaction", ["created", "updated", "deleted", "completed", "commented", "assigned", "moved"])
    create_enum("notificationtype", ["task_assigned", "comment_mentioned", "project_updated", "deadline_reminder", "workspace_joined"])

    # -----------------------------
    # USERS
    # -----------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("avatar_url", sa.String()),
        sa.Column("headline", sa.String()),
        sa.Column("profile_visibility", sa.String(), server_default=sa.text("'public'"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    # -----------------------------
    # WORKSPACES
    # -----------------------------
    op.create_table(
        "workspaces",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False, unique=True),
        sa.Column("logo_url", sa.String()),
        sa.Column(
            "owner_id",
            sa.UUID(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )

    # -----------------------------
    # WORKSPACE MEMBERS
    # -----------------------------
    op.create_table(
        "workspace_members",
        sa.Column("workspace_id", sa.UUID(), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.Enum(name="workspacerole", create_type=False), nullable=False),
    )

    # -----------------------------
    # INVITATIONS
    # -----------------------------
    op.create_table(
        "invitations",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_by_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.Enum(name="workspacerole", create_type=False), server_default=sa.text("'member'"), nullable=False),
        sa.Column("token", sa.String(), nullable=False, unique=True),
        sa.Column("expires_at", sa.TIMESTAMP(), nullable=False),
        sa.Column("status", sa.Enum(name="invitationstatus", create_type=False), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )

    # -----------------------------
    # PROJECTS
    # -----------------------------
    op.create_table(
        "projects",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("workspace_id", sa.UUID(), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("owner_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String()),
        sa.Column("deadline", sa.TIMESTAMP(timezone=True)),
        sa.Column("status", sa.Enum(name="projectstatus", create_type=False), server_default=sa.text("'active'"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # -----------------------------
    # TASKS
    # -----------------------------
    op.create_table(
        "tasks",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("project_id", sa.UUID(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("status", sa.Enum(name="taskstatus", create_type=False), server_default=sa.text("'todo'"), nullable=False),
        sa.Column("priority", sa.Enum(name="taskpriority", create_type=False), server_default=sa.text("'medium'"), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True)),
        sa.Column("position", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_by", sa.UUID(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    # Drop tables (reverse order)
    op.drop_table("tasks")
    op.drop_table("projects")
    op.drop_table("invitations")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
    op.drop_table("users")

    # Drop enums safely
    drop_enum("notificationtype")
    drop_enum("activityaction")
    drop_enum("taskpriority")
    drop_enum("taskstatus")
    drop_enum("projectstatus")
    drop_enum("invitationstatus")
    drop_enum("workspacerole")