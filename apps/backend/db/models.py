import enum
from uuid import uuid4

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    DateTime,
    ForeignKey,
    Enum,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


# ------------------------------------------------------------------
# USERS
# ------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    external_auth_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ------------------------------------------------------------------
# PROJECTS (WORKSPACE)
# ------------------------------------------------------------------

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        String,
        ForeignKey("users.external_auth_id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="projects")
    documents = relationship(
        "Document",
        back_populates="project",
        cascade="all, delete-orphan"
    )


# ------------------------------------------------------------------
# DOCUMENTS
# ------------------------------------------------------------------

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    title = Column(String, nullable=False)
    main_tex_path = Column(String, default="main.tex")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="documents")
    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentVersion.version_number"
    )
    assets = relationship(
        "Asset",
        back_populates="document",
        cascade="all, delete-orphan"
    )


# ------------------------------------------------------------------
# DOCUMENT VERSIONS (IMMUTABLE)
# ------------------------------------------------------------------

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    version_number = Column(Integer, nullable=False)
    latex_source = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="versions")
    prompts = relationship(
        "Prompt",
        back_populates="version",
        cascade="all, delete-orphan"
    )
    compilation_jobs = relationship(
        "CompilationJob",
        back_populates="version",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_document_version_unique", "document_id", "version_number", unique=True),
    )


# ------------------------------------------------------------------
# PROMPTS (AI TRACEABILITY)
# ------------------------------------------------------------------

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="CASCADE"),
        nullable=False
    )

    user_prompt = Column(Text, nullable=False)
    system_prompt = Column(Text, nullable=True)
    model_name = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("DocumentVersion", back_populates="prompts")


# ------------------------------------------------------------------
# COMPILATION JOBS
# ------------------------------------------------------------------

class CompileStatus(enum.Enum):
    queued = "queued"
    running = "running"
    success = "success"
    failed = "failed"


class CompilationJob(Base):
    __tablename__ = "compilation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="CASCADE"),
        nullable=False
    )

    status = Column(Enum(CompileStatus, name="compile_status"), nullable=False)
    log = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("DocumentVersion", back_populates="compilation_jobs")


# ------------------------------------------------------------------
# ASSETS (IMAGES, BIB, CSV, ETC.)
# ------------------------------------------------------------------

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="assets")


# ------------------------------------------------------------------
# TEMPLATES
# ------------------------------------------------------------------

class Template(Base):
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    latex_boilerplate = Column(Text, nullable=False)
    is_public = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ------------------------------------------------------------------
# INDEXES (PERFORMANCE)
# ------------------------------------------------------------------

Index("idx_projects_user_id", Project.user_id)
Index("idx_documents_project_id", Document.project_id)
Index("idx_versions_document_id", DocumentVersion.document_id)
Index("idx_compilation_version_id", CompilationJob.document_version_id)
