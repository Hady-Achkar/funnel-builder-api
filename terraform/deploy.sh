#!/bin/bash

# Terraform deployment script for funnel-builder-api

set -e

ENVIRONMENT=""
ACTION=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [dev|prod] [plan|apply|destroy]"
    echo ""
    echo "Examples:"
    echo "  $0 dev plan     # Plan development infrastructure"
    echo "  $0 dev apply    # Deploy development infrastructure"
    echo "  $0 prod plan    # Plan production infrastructure"
    echo "  $0 prod apply   # Deploy production infrastructure"
    echo "  $0 dev destroy  # Destroy development infrastructure"
    echo ""
}

if [ $# -ne 2 ]; then
    print_usage
    exit 1
fi

ENVIRONMENT=$1
ACTION=$2

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    echo -e "${RED}Error: Environment must be 'dev' or 'prod'${NC}"
    print_usage
    exit 1
fi

if [[ ! "$ACTION" =~ ^(plan|apply|destroy)$ ]]; then
    echo -e "${RED}Error: Action must be 'plan', 'apply', or 'destroy'${NC}"
    print_usage
    exit 1
fi

echo -e "${BLUE}🚀 Funnel-Builder-API Infrastructure Deployment${NC}"
echo -e "${BLUE}Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${BLUE}Action: ${YELLOW}$ACTION${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed${NC}"
    exit 1
fi

if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    exit 1
fi

# Check if logged into Azure
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged into Azure. Run 'az login' first${NC}"
    exit 1
fi

# Check SSH key
SSH_KEY_PATH="$HOME/.ssh/id_rsa.pub"
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH public key not found at $SSH_KEY_PATH${NC}"
    echo -e "${YELLOW}   Generating SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f "$HOME/.ssh/id_rsa" -N ""
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
    echo -e "${BLUE}🔧 Initializing Terraform...${NC}"
    terraform init
fi

TFVARS_FILE="environments/${ENVIRONMENT}.tfvars"

if [ ! -f "$TFVARS_FILE" ]; then
    echo -e "${RED}❌ Configuration file $TFVARS_FILE not found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Using configuration: ${YELLOW}$TFVARS_FILE${NC}"
echo ""

case $ACTION in
    plan)
        echo -e "${BLUE}📋 Planning $ENVIRONMENT infrastructure...${NC}"
        terraform plan -var-file="$TFVARS_FILE" -out="tfplan-$ENVIRONMENT"
        echo ""
        echo -e "${GREEN}✅ Plan completed. To apply: terraform apply tfplan-$ENVIRONMENT${NC}"
        ;;
    
    apply)
        echo -e "${BLUE}🚀 Deploying $ENVIRONMENT infrastructure...${NC}"
        
        if [ "$ENVIRONMENT" = "prod" ]; then
            echo -e "${YELLOW}⚠️  This will deploy PRODUCTION infrastructure!${NC}"
            echo -e "${YELLOW}   Make sure you have:${NC}"
            echo -e "${YELLOW}   1. Set postgres_admin_password in $TFVARS_FILE${NC}"
            echo -e "${YELLOW}   2. Restricted allowed_ssh_ips to your actual IPs${NC}"
            echo -e "${YELLOW}   3. Configured your production domain${NC}"
            echo ""
            read -p "Continue with production deployment? (yes/no): " confirm
            if [ "$confirm" != "yes" ]; then
                echo -e "${YELLOW}Deployment cancelled${NC}"
                exit 1
            fi
        fi
        
        terraform apply -var-file="$TFVARS_FILE" -auto-approve
        
        echo ""
        echo -e "${GREEN}🎉 Infrastructure deployed successfully!${NC}"
        echo ""
        echo -e "${BLUE}📝 Next steps:${NC}"
        echo "1. Connect to VM: $(terraform output -raw vm_ssh_connection)"
        echo "2. Get database connection: terraform output postgres_connection_string"
        echo "3. Get Redis connection: terraform output redis_connection_string"
        echo "4. View all outputs: terraform output"
        echo ""
        echo -e "${BLUE}🔗 Useful commands:${NC}"
        echo "terraform output environment_variables  # Get env vars for .env file"
        echo "terraform output deployment_commands    # Get deployment instructions"
        ;;
    
    destroy)
        echo -e "${RED}🗑️  Destroying $ENVIRONMENT infrastructure...${NC}"
        echo -e "${RED}   This will DELETE ALL RESOURCES!${NC}"
        echo ""
        read -p "Are you sure you want to destroy $ENVIRONMENT infrastructure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}Destruction cancelled${NC}"
            exit 1
        fi
        
        terraform destroy -var-file="$TFVARS_FILE" -auto-approve
        echo -e "${GREEN}✅ Infrastructure destroyed${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}✅ Operation completed successfully!${NC}"