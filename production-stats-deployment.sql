-- Production Database Stats Deployment Script
-- Run this script in your PRODUCTION database to populate category-specific stats
-- This will add all 98 category-specific stats across all system categories

-- COLLAB_CX (Collaboration & Contact Centre) Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Hybrid Work Adoption', '88%', 'of organizations using hybrid collaboration tools', 'COLLAB_CX', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Remote Work Enabled', '82%', 'Of organizations prioritize collaboration tools', 'COLLAB_CX', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Customer Satisfaction', '+35%', 'increase in CSAT with Webex Contact Center', 'COLLAB_CX', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Customer Experience ROI', '300%', 'Average return on CX investments', 'COLLAB_CX', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Meeting Efficiency', '43%', 'reduction in meeting time with AI-powered insights', 'COLLAB_CX', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Agent Productivity', '35%', 'Improvement with modern contact centers', 'COLLAB_CX', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('First Call Resolution', '82%', 'FCR rate with intelligent contact routing', 'COLLAB_CX', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Webex Deployments', '800+', 'Organizations enabled with modern collaboration tools', 'COLLAB_CX', 300);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Contact Centers', '250+', 'Customer experience platforms implemented', 'COLLAB_CX', 301);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Video Endpoints', '100K+', 'Meeting room and desk video systems deployed', 'COLLAB_CX', 302);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Digital Workflows', '1,500+', 'Automated customer journey processes', 'COLLAB_CX', 303);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Omnichannel Integration', '95%', 'Customer touchpoint integration success rate', 'COLLAB_CX', 304);

-- EDGE_IOT (Edge & IoT Solutions) Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Connected Devices', '75B', 'IoT devices expected globally by 2025', 'EDGE_IOT', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Edge Computing Growth', '250%', 'Year-over-year adoption increase', 'EDGE_IOT', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('IoT Device Management', '10x', 'Scale improvement with modern platforms', 'EDGE_IOT', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Edge Processing', '55%', 'of enterprise data processed at the edge by 2025', 'EDGE_IOT', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Real-time Processing', '90%', 'Data processed at the edge', 'EDGE_IOT', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Efficiency', '40%', 'bandwidth savings with Cisco IoT edge intelligence', 'EDGE_IOT', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Deployment Speed', '10x', 'faster IoT deployment with Cisco IoT Operations Platform', 'EDGE_IOT', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('IoT Devices', '2M+', 'Connected devices managed across edge locations', 'EDGE_IOT', 500);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Edge Locations', '500+', 'Distributed computing sites deployed nationally', 'EDGE_IOT', 501);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Industrial Networks', '150+', 'Manufacturing and industrial IoT implementations', 'EDGE_IOT', 502);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Smart Building Systems', '300+', 'Intelligent building automation deployments', 'EDGE_IOT', 503);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('5G Network Slices', '100+', 'Private 5G networks designed and implemented', 'EDGE_IOT', 504);

-- EXPERTISE Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Certified Professionals', '2M+', 'Cisco certified individuals globally', 'EXPERTISE', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('R&D Investment', '$6.3B', 'annual investment in innovation', 'EXPERTISE', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cisco Certifications', '500+', 'Expert-level certified professionals', 'EXPERTISE', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Patents Portfolio', '15K+', 'technology patents held by Cisco', 'EXPERTISE', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cisco Gold Partner', 'Premier', 'Highest tier partnership status', 'EXPERTISE', 9);

-- GENERAL Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Digital Transformation', '91%', 'of organizations accelerating digital initiatives', 'GENERAL', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Speed', '400G', 'throughput with latest Cisco routing platforms', 'GENERAL', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Revenue Growth in 18 Months', '2x', 'Data#3 doubled revenue growth in just 18 months', 'GENERAL', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Multi-Cloud Usage', '92%', 'of enterprises using multiple cloud providers', 'GENERAL', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Threat Prevention', '99.9%', 'malware blocked by Cisco Secure Endpoint', 'GENERAL', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Automation', '80%', 'of network changes automated with Cisco DNA Center', 'GENERAL', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Infrastructure Uptime', '99.99%', 'availability with Cisco Catalyst switches', 'GENERAL', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Security ROI', '286%', 'average ROI from Cisco security investments', 'GENERAL', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cloud Cost Optimization', '35%', 'reduction in cloud costs with Cisco Cloud ACI', 'GENERAL', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cloud Services Revenue Increase', '700%', 'Achieved 700% increase in cloud services revenue', 'GENERAL', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('SD-WAN Adoption', '68%', 'of enterprises deploying SD-WAN solutions', 'GENERAL', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('IT Budget Growth', '+5.1%', 'average IT spending increase in 2024', 'GENERAL', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Application Migration', '2x', 'faster cloud migration with Cisco Intersight', 'GENERAL', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cisco Market Share', '#1', 'in enterprise networking globally', 'GENERAL', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Complexity', '50%', 'reduction in network complexity with intent-based networking', 'GENERAL', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Provisioning Time', '90%', 'reduction in device provisioning time', 'GENERAL', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Incident Response', '48%', 'faster incident response with XDR', 'GENERAL', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Experts Across ANZ', '1000+', 'Over 1000 technology experts across Australia and New Zealand', 'GENERAL', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Certified Vendor Technologies', '50+', 'Certified across more than 50 vendor technologies', 'GENERAL', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Data Centres', '15+', 'Sovereign cloud infrastructure', 'GENERAL', 5);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Customers Trust Data#3', '2,500+', 'Over 2,500 customers trust Data#3 for their technology needs', 'GENERAL', 5);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Security Operations', '24/7', 'Always-on threat monitoring', 'GENERAL', 6);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Support Coverage', '24/7', 'Round-the-clock support for critical systems', 'GENERAL', 6);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cloud Migrations', '2,000+', 'Successful digital transformations', 'GENERAL', 7);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Endpoints', '1M+', 'Devices under management', 'GENERAL', 8);

-- HYBRID_DC (Data Centre & Hybrid Cloud) Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Cloud Migration', '75%', 'of workloads moving to hybrid cloud by 2025', 'HYBRID_DC', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Hybrid Cloud Adoption', '85%', 'Of enterprises use hybrid cloud architectures', 'HYBRID_DC', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Infrastructure Cost Savings', '40%', 'reduction in TCO with Cisco HyperFlex', 'HYBRID_DC', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Data Center Optimization', '40%', 'Average cost reduction through modernization', 'HYBRID_DC', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Application Performance', '5x', 'faster application deployment with Cisco ACI', 'HYBRID_DC', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Application Portability', '3x', 'Faster application deployment across environments', 'HYBRID_DC', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Data Center Efficiency', '30%', 'energy savings with Cisco UCS servers', 'HYBRID_DC', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Multi-Cloud Platforms', '300+', 'Hybrid cloud environments architected and deployed', 'HYBRID_DC', 200);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Data Centre Migrations', '150+', 'Successful datacenter modernization projects', 'HYBRID_DC', 201);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Hypervisor Clusters', '2,000+', 'Virtualized compute nodes under management', 'HYBRID_DC', 202);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Storage Capacity', '50+ PB', 'Enterprise storage infrastructure deployed', 'HYBRID_DC', 203);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('DR Sites', '100+', 'Disaster recovery environments established', 'HYBRID_DC', 204);

-- OBSERVABILITY (Observability & Performance) Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('MTTR Reduction', '70%', 'faster mean time to resolution with AppDynamics', 'OBSERVABILITY', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('MTTR Reduction', '60%', 'Faster incident resolution with observability', 'OBSERVABILITY', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Application Visibility', '100%', 'full-stack observability across cloud and on-premise', 'OBSERVABILITY', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Performance Issues Prevented', '75%', 'Proactive issue detection rate', 'OBSERVABILITY', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Full-Stack Visibility', '95%', 'Application coverage with modern tools', 'OBSERVABILITY', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Performance Issues', '95%', 'of issues detected before user impact', 'OBSERVABILITY', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Operational Efficiency', '4x', 'improvement in IT productivity with ThousandEyes', 'OBSERVABILITY', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Insights', '10M+', 'Data points collected per minute for visibility', 'OBSERVABILITY', 400);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('APM Deployments', '400+', 'Application performance monitoring implementations', 'OBSERVABILITY', 401);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Synthetic Tests', '50K+', 'Proactive service quality tests running continuously', 'OBSERVABILITY', 402);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('MTTR Improvement', '65%', 'Average reduction in mean time to resolution', 'OBSERVABILITY', 403);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Dashboard Views', '5,000+', 'Real-time operational dashboards in production', 'OBSERVABILITY', 404);

-- SCALE Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Team Members', '1,500+', 'Across Australia', 'SCALE', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Years in Business', '45+', 'Trusted technology partner since 1978', 'SCALE', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Enterprise Customers', '8,000+', 'From SMB to Fortune 500', 'SCALE', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Annual Revenue', '$1.8B+', 'Sustained growth and investment', 'SCALE', 10);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Customers Across APAC', '12,000+', 'Serving customers across the Asia Pacific region', 'SCALE', 100);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Technology Partners', '100+', 'Strategic partnerships with leading vendors', 'SCALE', 101);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Office Locations', '25+', 'Presence across Australia and New Zealand', 'SCALE', 102);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Acquisition Growth', '15+', 'Strategic acquisitions expanding capabilities', 'SCALE', 103);

-- SECURE_CONNECTIVITY (Zero Trust & Secure Connectivity) Stats
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Zero Trust Adoption', '70%', 'of organizations implementing zero trust by 2025', 'SECURE_CONNECTIVITY', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Security Breach Prevention', '95%', 'Of attacks blocked with Cisco Secure solutions', 'SECURE_CONNECTIVITY', 1);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('SASE Deployment', '60%', 'growth in secure access service edge adoption', 'SECURE_CONNECTIVITY', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Segmentation', '80%', 'Improvement in lateral movement prevention', 'SECURE_CONNECTIVITY', 2);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Security Policy Enforcement', '99%', 'automated policy compliance with Cisco ISE', 'SECURE_CONNECTIVITY', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Encrypted Traffic Analysis', '100%', 'visibility into encrypted communications', 'SECURE_CONNECTIVITY', 3);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Incident Response Time', '75%', 'reduction with integrated security stack', 'SECURE_CONNECTIVITY', 4);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Security Deployments', '1,200+', 'Comprehensive security architectures implemented', 'SECURE_CONNECTIVITY', 600);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Zero Trust Networks', '300+', 'Zero trust architecture implementations', 'SECURE_CONNECTIVITY', 601);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Secure SD-WAN', '800+', 'Secure wide area network deployments', 'SECURE_CONNECTIVITY', 602);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Network Access Control', '2M+', 'Endpoints protected with identity-based access', 'SECURE_CONNECTIVITY', 603);
INSERT INTO data3_stats (title, value, description, category, display_order) VALUES ('Threat Intelligence', '100B+', 'Security events analyzed per day across customer base', 'SECURE_CONNECTIVITY', 604);

-- Verification Query: After running this script, verify with:
-- SELECT category, COUNT(*) as count FROM data3_stats GROUP BY category ORDER BY category;
-- Expected results:
-- COLLAB_CX: 12 stats
-- EDGE_IOT: 12 stats  
-- EXPERTISE: 5 stats
-- GENERAL: 25 stats
-- HYBRID_DC: 12 stats
-- OBSERVABILITY: 12 stats
-- SCALE: 8 stats
-- SECURE_CONNECTIVITY: 12 stats
-- TOTAL: 98 stats