# Upgrade Progress

  ### ✅ Generate Upgrade Plan
  - [[View Log]](logs/1.generatePlan.log)

  ### ✅ Confirm Upgrade Plan
  - [[View Log]](logs/2.confirmPlan.log)

  ### ✅ Setup Development Environment
  - [[View Log]](logs/3.setupEnvironment.log)
  
  > There are uncommitted changes in the project before upgrading, which have been stashed according to user setting "appModernization.uncommittedChangesAction".

  ### ✅ PreCheck
  - [[View Log]](logs/4.precheck.log)
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Precheck - Build project
    - [[View Log]](logs/4.1.precheck-buildProject.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  
    ### ✅ Precheck - Validate CVEs
    - [[View Log]](logs/4.2.precheck-validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### CVE issues
    </details>
  
    ### ✅ Precheck - Run tests
    - [[View Log]](logs/4.3.precheck-runTests.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Test result
    | Total | Passed | Failed | Skipped | Errors |
    |-------|--------|--------|---------|--------|
    | 0 | 0 | 0 | 0 | 0 |
    </details>
  </details>

  ### ⏳ Upgrade project to use `Java 21` ...Running
  
  
  - ###
    ### ⏳ Upgrade using Agent ...Running