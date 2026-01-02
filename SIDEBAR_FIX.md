# Sidebar Fix Plan

## Problem
Two sidebars showing because:
1. layout.tsx wraps all teacher pages with DashboardLayout  
2. streams/page.tsx ALSO wraps content with DashboardLayout

## Solution
Remove DashboardLayout from page.tsx since layout.tsx already provides it.

## Changes Needed
1. Remove import of DashboardLayout
2. Change `return (<DashboardLayout role="TEACHER">` to `return (`
3. Remove closing `</DashboardLayout>` 
4. Add participant fields and column

## Testing
Must ensure component structure stays valid - no missing closing tags
