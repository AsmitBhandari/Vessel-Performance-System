"""create ports and historical routes

Revision ID: 701289ab9d27
Revises: c73d52658f06
Create Date: 2026-06-04 07:39:20.533242

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '701289ab9d27'
down_revision: Union[str, Sequence[str], None] = 'c73d52658f06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ports table
    op.create_table(
        'ports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ports_name'), 'ports', ['name'], unique=True)

    # Create historical_routes table
    op.create_table(
        'historical_routes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('origin_port_id', sa.Integer(), nullable=False),
        sa.Column('destination_port_id', sa.Integer(), nullable=False),
        sa.Column('route_name', sa.String(length=255), nullable=False),
        sa.Column('route_distance_nm', sa.Float(), nullable=False),
        sa.Column('route_type', sa.String(length=50), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('data_source', sa.String(length=255), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('waypoints', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('weather_risk', sa.String(length=50), nullable=True),
        sa.Column('fuel_estimate_mt', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['origin_port_id'], ['ports.id'], ),
        sa.ForeignKeyConstraint(['destination_port_id'], ['ports.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_route_origin_dest', 'historical_routes', ['origin_port_id', 'destination_port_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_route_origin_dest', table_name='historical_routes')
    op.drop_table('historical_routes')
    op.drop_index(op.f('ix_ports_name'), table_name='ports')
    op.drop_table('ports')

