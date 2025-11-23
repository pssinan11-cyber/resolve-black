import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'admin';
}

const DEFAULT_TEST_USERS: TestUser[] = [
  { email: 'sarah.johnson@test.com', password: 'Test123!', fullName: 'Sarah Johnson', role: 'student' },
  { email: 'michael.chen@test.com', password: 'Test123!', fullName: 'Michael Chen', role: 'admin' },
  { email: 'emily.rodriguez@test.com', password: 'Test123!', fullName: 'Emily Rodriguez', role: 'student' },
  { email: 'james.wilson@test.com', password: 'Test123!', fullName: 'James Wilson', role: 'student' },
  { email: 'aisha.patel@test.com', password: 'Test123!', fullName: 'Aisha Patel', role: 'admin' },
  { email: 'david.kim@test.com', password: 'Test123!', fullName: 'David Kim', role: 'student' },
  { email: 'maria.garcia@test.com', password: 'Test123!', fullName: 'Maria Garcia', role: 'student' },
  { email: 'robert.taylor@test.com', password: 'Test123!', fullName: 'Robert Taylor', role: 'admin' },
];

interface CreationResult {
  created?: Array<{ email: string; userId: string; role: string; success: boolean; action?: string }>;
  errors?: Array<{ email: string; error: string }>;
  summary?: { total: number; successful: number; failed: number };
}

export const BatchCreateUsers = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<CreationResult | null>(null);
  const { toast } = useToast();

  const handleCreateUsers = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-test-users', {
        body: { users: DEFAULT_TEST_USERS }
      });

      if (error) {
        console.error('Error invoking function:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create test users",
          variant: "destructive",
        });
        return;
      }

      setResult(data);

      if (data.summary) {
        if (data.summary.failed === 0) {
          toast({
            title: "Success",
            description: `Successfully created all ${data.summary.successful} test users!`,
          });
        } else {
          toast({
            title: "Partial Success",
            description: `Created ${data.summary.successful} users. ${data.summary.failed} failed.`,
            variant: "default",
          });
        }
      }

    } catch (error) {
      console.error('Error creating test users:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Batch Create Test Users
        </CardTitle>
        <CardDescription>
          Create multiple test users with authentication, profiles, and roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This will create {DEFAULT_TEST_USERS.length} test users:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            <li>{DEFAULT_TEST_USERS.filter(u => u.role === 'student').length} students</li>
            <li>{DEFAULT_TEST_USERS.filter(u => u.role === 'admin').length} admins</li>
            <li>All with password: Test123!</li>
          </ul>
        </div>

        <Button 
          onClick={handleCreateUsers} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Users...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Create Test Users
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            {result.summary && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 bg-muted rounded">
                  <div className="font-semibold">{result.summary.total}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {result.summary.successful}
                  </div>
                  <div className="text-muted-foreground">Success</div>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    {result.summary.failed}
                  </div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
              </div>
            )}

            {result.created && result.created.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Successfully Processed
                </h4>
                <div className="space-y-1 text-xs">
                  {result.created.map((user) => (
                    <div key={user.userId} className="flex items-center gap-2 text-muted-foreground">
                      <span>✓</span>
                      <span>{user.email}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{user.role}</span>
                      {user.action && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {user.action}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Errors
                </h4>
                <div className="space-y-1 text-xs">
                  {result.errors.map((error, idx) => (
                    <div key={idx} className="text-destructive">
                      <span className="font-semibold">{error.email}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
