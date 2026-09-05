import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IssueCard } from "@/components/issues/issue-card";

describe("Smoke Tests: Core UI Components", () => {
  it("renders Button component with label and handles variant", () => {
    render(<Button variant="default">Create Ticket</Button>);
    const btn = screen.getByRole("button", { name: /create ticket/i });
    expect(btn).toBeInTheDocument();
  });

  it("renders Badge component with status text", () => {
    render(<Badge variant="secondary">In Progress</Badge>);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders Card layout container cleanly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
        </CardHeader>
        <CardContent>Configuration options</CardContent>
      </Card>
    );
    expect(screen.getByText("Project Settings")).toBeInTheDocument();
    expect(screen.getByText("Configuration options")).toBeInTheDocument();
  });

  it("renders IssueCard with issue key, title, and estimate", () => {
    const mockIssue = {
      id: "issue-1",
      projectKey: "TRIP",
      issueNumber: 101,
      title: "Add Razorpay Payment Gateway",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      estimate: 5,
      assignee: { id: "u-1", name: "Nithin", image: null },
      _count: { comments: 3, attachments: 1 },
    };

    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText("TRIP-101")).toBeInTheDocument();
    expect(screen.getByText("Add Razorpay Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("5 pts")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // comment count
  });
});
