import RoleBasedLogin from '../RoleBasedLogin';

export default function RoleBasedLoginExample() {
  return (
    <RoleBasedLogin 
      onLogin={(role, credentials) => {
        console.log('Login:', role, credentials);
        alert(`Logging in as ${role} with email: ${credentials.email}`);
      }}
    />
  );
}