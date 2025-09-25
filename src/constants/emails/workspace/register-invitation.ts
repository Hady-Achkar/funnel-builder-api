export const WORKSPACE_REGISTER_INVITATION_EMAIL = {
  templateId: "d-workspace-register-invitation-template",
  subject: "You've been invited to join a workspace - Register now",
  previewText: "Create your account and join the workspace",
  template: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">Workspace Invitation</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">You've been invited!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          You have been invited to join the workspace <strong>{{workspaceName}}</strong> as a <strong>{{role}}</strong>.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          To accept this invitation, you need to create an account on our platform first.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{registerInvitationLink}}" 
           style="background-color: #387e3d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Register & Join Workspace
        </a>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
        <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
          This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          © 2024 Digitalsite. All rights reserved.
        </p>
      </div>
    </div>
  `
};