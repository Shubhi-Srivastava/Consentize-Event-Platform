using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace FIGAPI.Data;

public partial class FigContext : DbContext
{
    public FigContext()
    {
    }

    public FigContext(DbContextOptions<FigContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Booth> Booths { get; set; }

    public virtual DbSet<DesignerArtifact> DesignerArtifacts { get; set; }

    public virtual DbSet<EfmigrationsHistory> EfmigrationsHistories { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<EventBoothsVisited> EventBoothsVisiteds { get; set; }

    public virtual DbSet<EventsArtifact> EventsArtifacts { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserEvent> UserEvents { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySQL("Server=project-fig.c45do3hgyiqc.us-east-2.rds.amazonaws.com;Port=3306;Database=fig;Uid=admin;Pwd=ProjectFig2023;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booth>(entity =>
        {
            entity.HasKey(e => e.BoothId).HasName("PRIMARY");

            entity.ToTable("Booth");

            entity.HasIndex(e => e.EventId, "Booth_EventId_idx");

            entity.Property(e => e.BoothId).HasColumnName("Booth_Id");
            entity.Property(e => e.BoothNo).HasColumnName("Booth_No");
            entity.Property(e => e.CheckinsCount).HasColumnName("Checkins_count");
            entity.Property(e => e.DesignerId).HasColumnName("Designer_Id");
            entity.Property(e => e.DesignerName)
                .HasMaxLength(50)
                .HasColumnName("Designer_Name");
            entity.Property(e => e.EventId).HasColumnName("Event_Id");
            entity.Property(e => e.QrCodeUrl)
                .HasMaxLength(100)
                .HasColumnName("QR_CodeURL");

            entity.HasOne(d => d.Event).WithMany()
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("Booth_EventId");
        });

        modelBuilder.Entity<DesignerArtifact>(entity =>
        {
            entity.HasKey(e => e.DesignerArtifactId).HasName("PRIMARY");

            entity.ToTable("Designer_Artifacts");

            entity.HasIndex(e => e.UserId, "User_Id_idx");

            entity.Property(e => e.DesignerArtifactId).HasColumnName("Designer_Artifact_Id");
            entity.Property(e => e.EventId).HasColumnName("Event_Id");
            entity.Property(e => e.Link).HasMaxLength(100);
            entity.Property(e => e.LinkDescription)
                .HasMaxLength(100)
                .HasColumnName("Link_Description");
            entity.Property(e => e.UserId).HasColumnName("User_Id");

            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("User_Id");
        });

        modelBuilder.Entity<EfmigrationsHistory>(entity =>
        {
            entity.HasKey(e => e.MigrationId).HasName("PRIMARY");

            entity.ToTable("__EFMigrationsHistory");

            entity.Property(e => e.MigrationId).HasMaxLength(150);
            entity.Property(e => e.ProductVersion).HasMaxLength(32);
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.EventId).HasName("PRIMARY");

            entity.Property(e => e.EventId).HasColumnName("Event_Id");
            entity.Property(e => e.CurrentEvent)
                .HasMaxLength(1)
                .HasColumnName("Current_Event");
            entity.Property(e => e.PublishEvent)
                .HasMaxLength(1)
                .HasColumnName("PublishEvent");
            entity.Property(e => e.EventBio)
                .HasMaxLength(250)
                .HasColumnName("Event_Bio");
            entity.Property(e => e.EventEndTime)
                .HasColumnType("datetime")
                .HasColumnName("Event_EndTime");
            entity.Property(e => e.EventLocation)
                .HasMaxLength(50)
                .HasColumnName("Event_Location");
            entity.Property(e => e.EventName)
                .HasMaxLength(50)
                .HasColumnName("Event_Name");
            entity.Property(e => e.EventStartTime)
                .HasColumnType("datetime")
                .HasColumnName("Event_StartTime");
            entity.Property(e => e.PublishEvent).HasMaxLength(1);
            entity.Property(e => e.TicketLink)
                .HasMaxLength(100)
                .HasColumnName("Ticket_Link");
        });

        modelBuilder.Entity<EventBoothsVisited>(entity =>
        {
            entity.HasKey(e => e.EventBoothVisitedId).HasName("PRIMARY");

            entity.ToTable("EventBooths_Visited");

            entity.HasIndex(e => e.UserId, "EventBooths_Visited_User_ID_idx");

            entity.Property(e => e.EventBoothVisitedId).HasColumnName("Event_Booth_Visited_Id");
            entity.Property(e => e.BoothNo).HasColumnName("Booth_No");
            entity.Property(e => e.EventId).HasColumnName("Event_Id");
            entity.Property(e => e.UserId).HasColumnName("User_ID");

            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("EventBooths_Visited_User_ID");
        });

        modelBuilder.Entity<EventsArtifact>(entity =>
        {
            entity.HasKey(e => e.EventArtifactId).HasName("PRIMARY");

            entity.ToTable("Events_Artifacts");

            entity.HasIndex(e => e.EventId, "Events_Artifacts_EventId_idx");

            entity.Property(e => e.EventArtifactId).HasColumnName("Event_Artifact_Id");
            entity.Property(e => e.EventId).HasColumnName("Event_Id");
            entity.Property(e => e.Link).HasMaxLength(100);
            entity.Property(e => e.LinkDescription)
                .HasMaxLength(100)
                .HasColumnName("Link_Description");

            entity.HasOne(d => d.Event).WithMany()
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("Events_Artifacts_EventId");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity.ToTable("User");

            entity.Property(e => e.UserId).HasColumnName("User_ID");
            entity.Property(e => e.EmailAddress)
                .HasMaxLength(50)
                .HasColumnName("Email_Address");
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Password).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(25)
                .HasColumnName("Phone_Number");
             entity.Property(e => e.ProfilePhotoUrl)
                .HasMaxLength(300)
                .HasColumnName("ProfilePhoto_URL");
            entity.Property(e => e.ProfilePhotoDescription)
                .HasMaxLength(30)
                .HasColumnName("ProfilePhoto_Description");
            entity.Property(e => e.RefreshToken).HasMaxLength(200);
            entity.Property(e => e.RefreshTokenExpires).HasColumnType("datetime");
            entity.Property(e => e.ResetCode).HasMaxLength(15);
            entity.Property(e => e.Token).HasMaxLength(200);
            entity.Property(e => e.TokenCreated).HasColumnType("datetime");
            entity.Property(e => e.TokenExpires).HasColumnType("datetime");
        });

        modelBuilder.Entity<UserEvent>(entity =>
        {
            entity.HasKey(e => e.UserEventId).HasName("PRIMARY");

            entity.ToTable("User_Events");

            entity.HasIndex(e => e.EventId, "User_Events_Event_Id_idx");

            entity.HasIndex(e => e.UserId, "User_Events_User_Id_idx");

            entity.Property(e => e.UserEventId).HasColumnName("User_Event_Id");
            entity.Property(e => e.ApprovalStatus)
                .HasMaxLength(1)
                .HasColumnName("Approval_Status");
            entity.Property(e => e.DigitalGoodiesReceived)
                .HasMaxLength(1)
                .HasColumnName("DigitalGoodies_Received");
            entity.Property(e => e.DigitatWallet).HasMaxLength(200);
            entity.Property(e => e.EventId).HasColumnName("Event_Id");
            entity.Property(e => e.Facebook).HasMaxLength(100);
            entity.Property(e => e.Instagram).HasMaxLength(100);
            entity.Property(e => e.NotificationStatus).HasMaxLength(1);
            entity.Property(e => e.PersonalBio)
                .HasMaxLength(500)
                .HasColumnName("Personal_Bio");
            entity.Property(e => e.PersonalWebsite)
                .HasMaxLength(200)
                .HasColumnName("Personal_Website");
            entity.Property(e => e.Tiktok).HasMaxLength(100);
            entity.Property(e => e.Twitter).HasMaxLength(100);
            entity.Property(e => e.UserId).HasColumnName("User_Id");
            entity.Property(e => e.UserType)
                .HasMaxLength(45)
                .HasColumnName("User_Type");
            entity.Property(e => e.Youtube).HasMaxLength(500);

            entity.HasOne(d => d.Event).WithMany()
                .HasForeignKey(d => d.EventId)
                .HasConstraintName("User_Events_Event_Id");

            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("User_Events_User_Id");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
