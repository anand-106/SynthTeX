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
    sandbox_id = Column(String,nullable=True)
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

    entry_file = Column(String, nullable=False, default="main.tex")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="projects")
    files = relationship(
        "File",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )
    compilation_jobs = relationship(
        "CompilationJob",
        back_populates="project",
        cascade="all, delete-orphan"
    )


# ------------------------------------------------------------------
# FILES
# ------------------------------------------------------------------

class FileType(enum.Enum):
    source = "source"                  # LaTeX source files (.tex, .bib, .sty, images, etc.)
    knowledge_base = "knowledge_base"  # Reference docs for AI generation


class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    filename = Column(String, nullable=False)
    file_type = Column(Enum(FileType, name="file_type"), nullable=False)
    storage_path = Column(String, nullable=False)  # S3 or local path
    mime_type = Column(String, nullable=True)
    content = Column(Text, nullable=True)  # For text files, store content directly

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="files")

    __table_args__ = (
        Index("idx_file_project_filename", "project_id", "filename", unique=True),
    )


# ------------------------------------------------------------------
# CHAT MESSAGES
# ------------------------------------------------------------------

class MessageRole(enum.Enum):
    user = "user"
    model = "model"
    tools = "tools"



class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    role = Column(Enum(MessageRole, name="message_role"), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="chat_messages")


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
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    status = Column(Enum(CompileStatus, name="compile_status"), nullable=False)
    log = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="compilation_jobs")


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
Index("idx_files_project_id", File.project_id)
Index("idx_files_type", File.file_type)
Index("idx_chat_messages_project_id", ChatMessage.project_id)
Index("idx_compilation_project_id", CompilationJob.project_id)
