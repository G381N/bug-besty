import DeleteProjectButton from "@/components/DeleteProjectButton";

// Then in your component's JSX
return (
  <div>
    <h1>{project.name}</h1>
    {/* Other project details */}
    
    <div className="project-actions">
      {/* Other action buttons */}
      <DeleteProjectButton projectId={project._id} />
    </div>
  </div>
); 