"""
Web Scraping Functions
Fetches and parses web content with various extraction methods
"""
import re
import json
from urllib.parse import urlparse, urljoin
from html.parser import HTMLParser
from typing import Dict, List, Any


class SimpleHTMLParser(HTMLParser):
    """Simple HTML parser for extracting various elements"""
    
    def __init__(self):
        super().__init__()
        self.links = []
        self.images = []
        self.headings = {"h1": [], "h2": [], "h3": [], "h4": [], "h5": [], "h6": []}
        self.paragraphs = []
        self.meta_tags = []
        self.current_tag = None
        self.current_data = ""
    
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == "a" and "href" in attrs_dict:
            self.links.append({
                "href": attrs_dict["href"],
                "title": attrs_dict.get("title", ""),
                "rel": attrs_dict.get("rel", "")
            })
        elif tag == "img" and "src" in attrs_dict:
            self.images.append({
                "src": attrs_dict["src"],
                "alt": attrs_dict.get("alt", ""),
                "title": attrs_dict.get("title", "")
            })
        elif tag == "meta":
            self.meta_tags.append(attrs_dict)
        elif tag in self.headings:
            self.current_tag = tag
            self.current_data = ""
        elif tag == "p":
            self.current_tag = "p"
            self.current_data = ""
    
    def handle_data(self, data):
        if self.current_tag:
            self.current_data += data.strip()
    
    def handle_endtag(self, tag):
        if self.current_tag == tag and self.current_data:
            if tag in self.headings:
                self.headings[tag].append(self.current_data)
            elif tag == "p":
                self.paragraphs.append(self.current_data)
        self.current_tag = None
        self.current_data = ""


def main(content: str, extract_type: str = "all", options: Dict[str, Any] = None) -> dict:
    """
    Parse HTML content and extract various elements.
    
    Args:
        content (str): HTML content to parse
        extract_type (str): Type of extraction - 'all', 'links', 'text', 'metadata', 'structured'
        options (dict): Additional options for extraction
    
    Returns:
        dict: Extracted data based on the extraction type
    """
    if options is None:
        options = {}
    
    try:
        parser = SimpleHTMLParser()
        parser.feed(content)
        
        if extract_type == "links":
            return extract_links(parser, content, options)
        
        elif extract_type == "text":
            return extract_text(parser, content, options)
        
        elif extract_type == "metadata":
            return extract_metadata(parser, content, options)
        
        elif extract_type == "structured":
            return extract_structured(parser, content, options)
        
        elif extract_type == "emails":
            return extract_emails(content)
        
        elif extract_type == "phone_numbers":
            return extract_phone_numbers(content)
        
        elif extract_type == "urls":
            return extract_urls(content)
        
        elif extract_type == "all":
            return {
                "success": True,
                "links": parser.links,
                "images": parser.images,
                "headings": parser.headings,
                "paragraphs": parser.paragraphs[:10],  # Limit to first 10
                "meta_tags": parser.meta_tags,
                "stats": {
                    "total_links": len(parser.links),
                    "total_images": len(parser.images),
                    "total_headings": sum(len(h) for h in parser.headings.values()),
                    "total_paragraphs": len(parser.paragraphs)
                }
            }
        
        else:
            return {
                "error": f"Unknown extraction type: {extract_type}",
                "available_types": [
                    "all", "links", "text", "metadata", "structured",
                    "emails", "phone_numbers", "urls"
                ]
            }
    
    except Exception as e:
        return {"error": str(e), "extract_type": extract_type}


def extract_links(parser: SimpleHTMLParser, content: str, options: dict) -> dict:
    """Extract and analyze links from HTML"""
    base_url = options.get("base_url", "")
    filter_external = options.get("filter_external", False)
    
    links = parser.links
    
    if base_url:
        # Convert relative URLs to absolute
        for link in links:
            link["absolute_href"] = urljoin(base_url, link["href"])
            
        if filter_external:
            base_domain = urlparse(base_url).netloc
            links = [
                link for link in links
                if urlparse(link.get("absolute_href", link["href"])).netloc == base_domain
            ]
    
    # Categorize links
    internal = []
    external = []
    anchors = []
    
    for link in links:
        href = link.get("absolute_href", link["href"])
        if href.startswith("#"):
            anchors.append(link)
        elif href.startswith("http://") or href.startswith("https://"):
            if base_url and urlparse(href).netloc == urlparse(base_url).netloc:
                internal.append(link)
            else:
                external.append(link)
        else:
            internal.append(link)
    
    return {
        "success": True,
        "total_links": len(links),
        "internal_links": internal[:20],  # Limit results
        "external_links": external[:20],
        "anchor_links": anchors[:10],
        "stats": {
            "internal_count": len(internal),
            "external_count": len(external),
            "anchor_count": len(anchors)
        }
    }


def extract_text(parser: SimpleHTMLParser, content: str, options: dict) -> dict:
    """Extract and process text content"""
    include_headings = options.get("include_headings", True)
    max_length = options.get("max_length", 5000)
    
    text_parts = []
    
    if include_headings:
        for level in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            for heading in parser.headings[level]:
                if heading:
                    text_parts.append(heading)
    
    text_parts.extend(parser.paragraphs)
    
    # Join and clean text
    full_text = " ".join(text_parts)
    full_text = re.sub(r'\s+', ' ', full_text).strip()
    
    if len(full_text) > max_length:
        full_text = full_text[:max_length] + "..."
    
    # Calculate statistics
    words = full_text.split()
    sentences = re.split(r'[.!?]+', full_text)
    
    return {
        "success": True,
        "text": full_text,
        "stats": {
            "character_count": len(full_text),
            "word_count": len(words),
            "sentence_count": len([s for s in sentences if s.strip()]),
            "average_word_length": sum(len(w) for w in words) / len(words) if words else 0
        },
        "headings_summary": {
            level: headings[:5] for level, headings in parser.headings.items() if headings
        }
    }


def extract_metadata(parser: SimpleHTMLParser, content: str, options: dict) -> dict:
    """Extract metadata from HTML"""
    meta_tags = parser.meta_tags
    
    # Extract common metadata
    metadata = {
        "title": "",
        "description": "",
        "keywords": "",
        "author": "",
        "viewport": "",
        "charset": "",
        "og_tags": {},
        "twitter_tags": {},
        "other": []
    }
    
    # Search for title in content
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
    if title_match:
        metadata["title"] = title_match.group(1).strip()
    
    for tag in meta_tags:
        name = tag.get("name", "").lower()
        property_name = tag.get("property", "").lower()
        content_val = tag.get("content", "")
        
        if name == "description":
            metadata["description"] = content_val
        elif name == "keywords":
            metadata["keywords"] = content_val
        elif name == "author":
            metadata["author"] = content_val
        elif name == "viewport":
            metadata["viewport"] = content_val
        elif tag.get("charset"):
            metadata["charset"] = tag.get("charset")
        elif property_name.startswith("og:"):
            metadata["og_tags"][property_name] = content_val
        elif property_name.startswith("twitter:"):
            metadata["twitter_tags"][property_name] = content_val
        else:
            metadata["other"].append(tag)
    
    return {
        "success": True,
        "metadata": metadata,
        "total_meta_tags": len(meta_tags),
        "has_og_tags": len(metadata["og_tags"]) > 0,
        "has_twitter_tags": len(metadata["twitter_tags"]) > 0
    }


def extract_structured(parser: SimpleHTMLParser, content: str, options: dict) -> dict:
    """Extract structured data from HTML"""
    # Look for JSON-LD structured data
    json_ld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
    json_ld_matches = re.findall(json_ld_pattern, content, re.IGNORECASE | re.DOTALL)
    
    structured_data = []
    for match in json_ld_matches:
        try:
            data = json.loads(match.strip())
            structured_data.append(data)
        except json.JSONDecodeError:
            continue
    
    # Extract microdata patterns
    itemscope_count = content.count('itemscope')
    
    # Build document outline from headings
    outline = []
    for level in ["h1", "h2", "h3", "h4", "h5", "h6"]:
        for heading in parser.headings[level]:
            if heading:
                outline.append({"level": level, "text": heading})
    
    return {
        "success": True,
        "json_ld": structured_data[:5],  # Limit to first 5
        "has_json_ld": len(structured_data) > 0,
        "microdata_indicators": itemscope_count,
        "document_outline": outline[:20],  # Limit to first 20
        "images_with_alt": sum(1 for img in parser.images if img.get("alt")),
        "total_images": len(parser.images)
    }


def extract_emails(content: str) -> dict:
    """Extract email addresses from content"""
    # Simple email regex pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = list(set(re.findall(email_pattern, content)))
    
    return {
        "success": True,
        "emails": emails[:20],  # Limit to first 20
        "total_found": len(emails)
    }


def extract_phone_numbers(content: str) -> dict:
    """Extract phone numbers from content"""
    # Various phone number patterns
    patterns = [
        r'\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',  # US format
        r'\+?[0-9]{1,3}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}',  # International
        r'\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',  # Simple format
    ]
    
    phone_numbers = []
    for pattern in patterns:
        matches = re.findall(pattern, content)
        phone_numbers.extend(matches)
    
    # Remove duplicates and clean
    phone_numbers = list(set(num.strip() for num in phone_numbers))
    
    return {
        "success": True,
        "phone_numbers": phone_numbers[:20],  # Limit to first 20
        "total_found": len(phone_numbers)
    }


def extract_urls(content: str) -> dict:
    """Extract all URLs from content"""
    # URL regex pattern
    url_pattern = r'https?://(?:[-\w.])+(?::\d+)?(?:/[^\s]*)?'
    urls = list(set(re.findall(url_pattern, content)))
    
    # Categorize URLs
    domains = {}
    for url in urls:
        domain = urlparse(url).netloc
        if domain:
            domains[domain] = domains.get(domain, 0) + 1
    
    return {
        "success": True,
        "urls": urls[:30],  # Limit to first 30
        "total_found": len(urls),
        "unique_domains": list(domains.keys())[:20],
        "domain_frequency": dict(sorted(domains.items(), key=lambda x: x[1], reverse=True)[:10])
    }