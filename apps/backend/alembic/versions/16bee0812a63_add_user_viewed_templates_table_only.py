"""Add user_viewed_templates table only

Revision ID: 16bee0812a63
Revises: e59a9c071a8e
Create Date: 2025-08-23 15:05:45.585615

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '16bee0812a63'
down_revision = 'e59a9c071a8e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_viewed_templates table
    op.create_table(
        'user_viewed_templates',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('viral_template_id', sa.String(), sa.ForeignKey('viral_video_templates.id'), nullable=False),
        sa.Column('viewed_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('context', sa.String(), nullable=True)
    )


def downgrade() -> None:
    # Drop user_viewed_templates table
    op.drop_table('user_viewed_templates')